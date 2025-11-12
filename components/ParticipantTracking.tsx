import React, { useState, useEffect } from 'react';
import type { Participant } from '../types';
import { useSocket } from '../App';
import { HomeIcon, WarningIcon, CheckCircleIcon } from './icons';

interface ParticipantTrackingProps {
    participant: Participant;
    navigateHome: () => void;
    trackingStatus: 'connecting' | 'active' | 'error';
    geoError: string | null;
    onStopTracking: (participantId: string) => void;
}

const ParticipantTracking: React.FC<ParticipantTrackingProps> = ({ participant, navigateHome, trackingStatus, geoError, onStopTracking }) => {
    const socket = useSocket();
    const [panicSent, setPanicSent] = useState(false);
    const [isConfirmingPanic, setIsConfirmingPanic] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const timerInterval = setInterval(() => {
            setElapsedTime(prevTime => prevTime + 1);
        }, 1000);

        return () => {
            clearInterval(timerInterval);
        };
    }, []);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        
        if (hours > 0) {
            const paddedHours = String(hours).padStart(2, '0');
            return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
        }
        return `${paddedMinutes}:${paddedSeconds}`;
    };

    const handlePanicClick = () => {
        setIsConfirmingPanic(true);
    };

    const handleConfirmPanic = () => {
        socket.emit('panic', { participantId: participant.id, location: participant.location });
        setPanicSent(true);
        setIsConfirmingPanic(false);
    };

    const handleCancelPanic = () => {
        setIsConfirmingPanic(false);
    };

    const handleStopTrackingClick = () => {
        if (window.confirm('¿Estás seguro de que quieres detener el seguimiento? Tu ubicación ya no será visible para el administrador y serás redirigido al menú principal.')) {
            onStopTracking(participant.id);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 relative">
            <button onClick={navigateHome} className="absolute top-4 left-4 p-3 rounded-full bg-white text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition">
                <HomeIcon className="w-6 h-6" />
                <span className="sr-only">Volver al Inicio</span>
            </button>
            <div className="w-full max-w-md text-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido, {participant.name}!</h2>
                    <p className="text-gray-600 mb-4">Participante #: {participant.number}</p>

                    <div className="my-6">
                        <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Tiempo de Seguimiento</p>
                        <div className="text-teal-600 font-mono text-4xl py-2 bg-gray-50 rounded-lg tracking-wider">
                            {formatTime(elapsedTime)}
                        </div>
                    </div>

                     <div className={`flex items-center justify-center space-x-2 p-3 rounded-lg mb-8 ${trackingStatus === 'active' ? 'bg-green-100 text-green-800' : trackingStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {trackingStatus === 'active' ? <CheckCircleIcon className="w-6 h-6 text-green-600" /> : <WarningIcon className={`w-6 h-6 ${trackingStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'}`} />}
                        <span className="font-medium">
                            {trackingStatus === 'active' && 'Seguimiento Activo'}
                            {trackingStatus === 'connecting' && 'Conectando...'}
                            {trackingStatus === 'error' && 'Error de Conexión'}
                        </span>
                    </div>
                    
                    {geoError && <p className="text-yellow-600 text-sm mb-6">{geoError}</p>}

                    {panicSent ? (
                        <div className="bg-green-100 border border-green-200 text-green-800 font-bold py-6 px-4 rounded-xl text-xl">
                            <div className="flex items-center justify-center">
                                <CheckCircleIcon className="w-8 h-8 mr-3" />
                                ¡ALERTA ENVIADA!
                            </div>
                             <p className="text-sm font-normal text-green-700 mt-2">La ayuda está en camino. Mantén la calma.</p>
                        </div>
                    ) : isConfirmingPanic ? (
                        <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-lg">
                            <p className="text-yellow-800 font-bold text-lg mb-4">¿Estás seguro?</p>
                            <p className="text-yellow-700 text-sm mb-4">Esto enviará una alerta de emergencia inmediata.</p>
                            <div className="flex justify-center space-x-4">
                                <button onClick={handleConfirmPanic} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition">Sí, ¡Enviar Alerta!</button>
                                <button onClick={handleCancelPanic} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition">Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={handlePanicClick}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-4 rounded-full text-2xl transition-transform transform hover:scale-105 animate-pulse"
                            >
                                <div className="flex items-center justify-center">
                                    <WarningIcon className="w-8 h-8 mr-3" />
                                    BOTÓN DE PÁNICO
                                </div>
                            </button>
                            <p className="text-xs text-gray-500 mt-4">Úsalo solo en caso de una emergencia real.</p>
                        </>
                    )}
                    
                    {!panicSent && !isConfirmingPanic && (
                        <button
                            onClick={handleStopTrackingClick}
                            className="w-full mt-6 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-lg transition"
                        >
                            Detener Seguimiento
                        </button>
                    )}

                    <button
                        onClick={navigateHome}
                        className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                        Volver al Menú Principal (Mantener Seguimiento)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParticipantTracking;