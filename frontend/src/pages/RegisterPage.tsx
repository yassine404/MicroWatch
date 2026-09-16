import { Form, Input, Button, Card, Typography } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; email: string; password: string }) => {
    
      await register(values.username, values.email, values.password);
      navigate('/dashboard');
    
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>Inscription</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Nom d'utilisateur" name="username" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mot de passe" name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              S'inscrire
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;