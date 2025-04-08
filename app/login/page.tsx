import { Metadata } from 'next';
import LoginPage from '../components/login/loginPage';

export const metadata: Metadata = {
    title: 'Вход',
    description: 'Войдите в свой аккаунт',
};

export default function Login() {
    return <LoginPage />;
}
