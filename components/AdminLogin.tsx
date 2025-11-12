import React, { useState } from 'react';

interface AdminLoginProps {
    onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would be a secure API call.
        if (password === 'admin123') {
            onLogin();
        } else {
            setError('Contraseña incorrecta. Por favor, inténtalo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Acceso de Administrador</h2>
                <p className="text-center text-gray-600 mb-8">Ingresa la contraseña para acceder al panel de control.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-transform transform hover:scale-105"
                    >
                        Iniciar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;