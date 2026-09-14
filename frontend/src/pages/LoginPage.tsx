import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password);
      // Redirection après un court délai pour laisser le temps à l'état de se mettre à jour
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (error: unknown) {
      console.error('Erreur de connexion:', error);
      let errorMsg = 'Erreur de connexion';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || error.message || 'Erreur de connexion';
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      message.error(errorMsg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Connexion</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Nom d'utilisateur" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mot de passe" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Se connecter
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;