import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI, fraudAPI } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [riskProfile, setRiskProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [txQuery, setTxQuery] = useState('');
  const [txFlaggedOnly, setTxFlaggedOnly] = useState(false);
  const [txSort, setTxSort] = useState('newest');
  const [formData, setFormData] = useState({
    amount: '',
    type: 'debit',
    category: '',
    description: '',
    location: ''
  });
  const navigate = useNavigate();

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const getErrorMessage = useCallback((error, fallback) => {
    const data = error?.response?.data;
    const validationMsg = Array.isArray(data?.errors)
      ? data.errors.map((e) => e.msg).filter(Boolean).join(', ')
      : '';

    return validationMsg || data?.message || error?.message || fallback;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [transRes, riskRes, alertRes] = await Promise.all([
        transactionAPI.getTransactions(),
        fraudAPI.getRiskProfile(),
        fraudAPI.getAlerts()
      ]);

      setTransactions(transRes.data);
      setRiskProfile(riskRes.data);
      setAlerts(alertRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }

      showToast('error', getErrorMessage(error, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }, [getErrorMessage, navigate, showToast]);

  useEffect(() => {
    fetchData();

    return () => {
      window.clearTimeout(toastTimeoutRef.current);
    };
  }, [fetchData]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await transactionAPI.addTransaction(
        parseFloat(formData.amount),
        formData.type,
        formData.category,
        formData.description,
        formData.location
      );

      setFormData({
        amount: '',
        type: 'debit',
        category: '',
        description: '',
        location: ''
      });

      fetchData();
      showToast('success', 'Transaction added');
    } catch (error) {
      console.error('Error adding transaction:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }

      showToast('error', getErrorMessage(error, 'Failed to add transaction'));
    }
  };

  const handleAnalyzeTransaction = async (transactionId) => {
    try {
      const id = transactionId || null;
      if (!id) {
        showToast('error', 'Missing transaction id');
        return;
      }

      setAnalyzingId(id);
      const response = await fraudAPI.analyzeTransaction(id);
      const riskScore = response?.data?.riskScore;
      const severity = response?.data?.severity;

      fetchData();
      showToast(
        'success',
        typeof riskScore === 'number' && severity
          ? `Analyzed: ${riskScore}% (${severity})`
          : 'Transaction analyzed'
      );
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }

      showToast('error', getErrorMessage(error, 'Analyze failed'));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleUpdateAlertStatus = async (alertId, status) => {
    try {
      await fraudAPI.updateAlertStatus(alertId, status);
      fetchData();
      showToast('success', 'Alert updated');
    } catch (error) {
      console.error('Error updating alert:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }

      showToast('error', getErrorMessage(error, 'Failed to update alert'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const visibleTransactions = transactions
    .filter((tx) => {
      if (txFlaggedOnly && !tx.isFlagged) return false;
      const q = txQuery.trim().toLowerCase();
      if (!q) return true;
      const category = String(tx.category || '').toLowerCase();
      const type = String(tx.type || '').toLowerCase();
      const location = String(tx.location || '').toLowerCase();
      return category.includes(q) || type.includes(q) || location.includes(q);
    })
    .sort((a, b) => {
      if (txSort === 'amount_desc') return Number(b.amount || 0) - Number(a.amount || 0);
      if (txSort === 'amount_asc') return Number(a.amount || 0) - Number(b.amount || 0);

      const at = new Date(a.timestamp || 0).getTime();
      const bt = new Date(b.timestamp || 0).getTime();
      return bt - at;
    });

  return (
    <div className="dashboard">
      {toast && (
        <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
      <header className="dashboard-header">
        <h1>Fraud Detection System</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="dashboard-container">
        {/* Risk Profile Summary */}
        <section className="risk-profile">
          <h2>Your Risk Profile</h2>
          {riskProfile && (
            <div className="profile-card">
              <div className="risk-score">
                <span className={`risk-score-value ${riskProfile.overallRiskScore > 50 ? 'high' : 'low'}`}>
                  {riskProfile.overallRiskScore}%
                </span>
                <p>Overall Risk Score</p>
              </div>
              <div className="profile-stats">
                <div className="stat">
                  <span className="label">Total Transactions:</span>
                  <span className="value">{riskProfile.totalTransactions}</span>
                </div>
                <div className="stat">
                  <span className="label">Flagged Transactions:</span>
                  <span className="value">{riskProfile.fraudulentTransactions}</span>
                </div>
                <div className="stat">
                  <span className="label">Avg Transaction:</span>
                  <span className="value">${riskProfile.averageTransactionAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Add Transaction Form */}
        <section className="add-transaction">
          <h2>Add Transaction</h2>
          <form onSubmit={handleAddTransaction}>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              step="0.01"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
            <input
              type="text"
              placeholder="Category (e.g., Grocery, Gas, Online)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Location (e.g., NYC, Los Angeles)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <button type="submit">Add Transaction</button>
          </form>
        </section>

        {/* Fraud Alerts */}
        <section className="fraud-alerts">
          <h2>Fraud Alerts ({alerts.length})</h2>
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <p>No fraud alerts detected.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert._id} className={`alert-item severity-${alert.severity}`}>
                  <div className="alert-header">
                    <span className="severity-badge">{alert.severity.toUpperCase()}</span>
                    <span className="alert-risk">Risk: {alert.riskScore}%</span>
                  </div>
                  <div className="alert-reasons">
                    {alert.reasons?.map((reason, idx) => (
                      <p key={idx}>{reason}</p>
                    ))}
                  </div>
                  <div className="alert-actions">
                    <select
                      value={alert.status}
                      onChange={(e) => handleUpdateAlertStatus(alert._id, e.target.value)}
                    >
                      <option value="flagged">Flagged</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="cleared">Cleared</option>
                      <option value="confirmed">Confirmed Fraud</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="recent-transactions">
          <h2>Recent Transactions</h2>
          <div className="tx-toolbar">
            <input
              className="tx-search"
              type="text"
              value={txQuery}
              onChange={(e) => setTxQuery(e.target.value)}
              placeholder="Search category, type, location…"
            />
            <label className="tx-toggle">
              <input
                type="checkbox"
                checked={txFlaggedOnly}
                onChange={(e) => setTxFlaggedOnly(e.target.checked)}
              />
              Flagged only
            </label>
            <select
              className="tx-sort"
              value={txSort}
              onChange={(e) => setTxSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="amount_desc">Amount (high → low)</option>
              <option value="amount_asc">Amount (low → high)</option>
            </select>
          </div>
          <div className="transactions-list">
            {visibleTransactions.length === 0 ? (
              <p>No transactions yet.</p>
            ) : (
              visibleTransactions.slice(0, 10).map((tx) => (
                <div key={tx._id} className="transaction-item">
                  <div className="tx-info">
                    <span className="category">{tx.category}</span>
                    <span className="amount">${Number(tx.amount || 0).toFixed(2)}</span>
                    <span className={`type ${tx.type}`}>{tx.type}</span>
                    {tx.isFlagged && <span className="pill pill-flagged">Flagged</span>}
                  </div>
                  <button
                    onClick={() => handleAnalyzeTransaction(tx._id || tx.id)}
                    className="analyze-btn"
                    disabled={analyzingId === (tx._id || tx.id)}
                  >
                    {analyzingId === (tx._id || tx.id) ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
