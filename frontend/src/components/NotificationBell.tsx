import { useEffect, useState } from 'react';
import { Badge, Button, Popover, Typography, Space, Spin } from 'antd';
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getUnacknowledgedAlerts, acknowledgeAlert } from '../api/alerts';
import type { Alert } from '../api/alerts';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Pas de token, chargement des alertes ignoré');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getUnacknowledgedAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error('Erreur chargement alertes', err);
      setError('Impossible de charger les alertes');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      setAlerts(alerts.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erreur acquittement', err);
    }
  };

  if (error) {
    return <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />;
  }

  const content = (
    <div style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
      {loading && alerts.length === 0 ? (
        <Spin description="Chargement..." />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {alerts.map((alert) => (
            <li key={alert.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Space>
                    <Typography.Text strong>{alert.serviceName}</Typography.Text>
                    <Typography.Text type={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {alert.severity}
                    </Typography.Text>
                  </Space>
                  <div>{alert.message}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </Typography.Text>
                </div>
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAcknowledge(alert.id)}
                  size="small"
                  style={{ marginLeft: 8 }}
                >
                  Acquitter
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && alerts.length === 0 && (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Typography.Text type="secondary">Aucune alerte non acquittée</Typography.Text>
        </div>
      )}
      <div style={{ padding: 8, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
        <Button type="link" onClick={() => navigate('/notifications')}>
          Voir toutes les notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Popover content={content} title="Alertes" trigger="click" placement="bottomRight">
      <Badge count={alerts.length} offset={[-10, 10]}>
        <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;