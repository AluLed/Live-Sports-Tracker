import React, { useState } from 'react';
import type { Event } from '../types';

interface ParticipantRegisterProps {
    onRegister: (participant: { name: string; number: string; eventId: string; }) => void;
    navigateHome: () => void;
    events: Event[];
}

const ParticipantRegister: React.FC<ParticipantRegisterProps> = ({ onRegister, navigateHome, events }) => {
    const [name, setName] = useState('');
    const [number, setNumber] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() === '' || number.trim() === '' || selectedEventId === '') {
            setError('Todos los campos son obligatorios.');
            return;
        }
        setError('');
        onRegister({ name, number, eventId: selectedEventId });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Registro de Participante</h2>
                <p className="text-center text-gray-600 mb-8">Ingresa tus datos para unirte al evento.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="event" className="block mb-2 text-sm font-medium text-gray-700">Selecciona un Evento</label>
                        {events.length > 0 ? (
                             <select
                                id="event"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-3"
                                required
                            >
                                <option value="" disabled>Elige un evento...</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-center text-yellow-800 bg-yellow-100 p-3 rounded-lg">No hay eventos activos disponibles para unirse.</p>
                        )}
                       
                    </div>

                    <div className="mb-4">
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">Nombre Completo</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-3"
                            placeholder="p. ej., Juan Pérez"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="number" className="block mb-2 text-sm font-medium text-gray-700">Número de Participante</label>
                        <input
                            type="text"
                            id="number"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block w-full p-3"
                            placeholder="p. ej., 1138"
                            required
                        />
                    </div>
                     {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    <div className="flex flex-col space-y-4">
                        <button
                            type="submit"
                            disabled={events.length === 0}
                            className="w-full text-white bg-teal-500 hover:bg-teal-600 focus:ring-4 focus:outline-none focus:ring-teal-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            Iniciar Seguimiento
                        </button>
                        <button
                            type="button"
                            onClick={navigateHome}
                            className="w-full text-gray-800 bg-gray-200 hover:bg-gray-300 font-medium rounded-lg text-sm px-5 py-3 text-center transition-transform transform hover:scale-105"
                        >
                            Volver al Menú
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ParticipantRegister;