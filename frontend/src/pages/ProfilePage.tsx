import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../api/user';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user } = useAuth();

  const handlePasswordChange = async (values: { oldPassword: string; newPassword: string }) => {
      await changePassword(values.oldPassword, values.newPassword);
      message.success('Mot de passe modifié avec succès');
    
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 50 }}>
      <Card style={{ width: 400 }}>
        <Title level={3}>Profil</Title>
        <p><Text strong>Nom d'utilisateur :</Text> {user?.username}</p>
        <p><Text strong>Email :</Text> {user?.email}</p>
        <p><Text strong>Rôle :</Text> {user?.role}</p>

        <Title level={4} style={{ marginTop: 24 }}>Changer le mot de passe</Title>
        <Form layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item label="Ancien mot de passe" name="oldPassword" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Nouveau mot de passe" name="newPassword" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit">Modifier</Button>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;