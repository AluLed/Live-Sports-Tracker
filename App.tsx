import React, { useState, useCallback, useRef, createContext, useContext, ReactNode, useEffect } from 'react';
import type { Participant, Event, LocationUpdate, Location } from './types';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ParticipantRegister from './components/ParticipantRegister';
import ParticipantTracking from './components/ParticipantTracking';
// FIX: import SocketClient instead of non-existent SocketServer
import { socketServer, SocketClient } from './socket';

type View = 'home' | 'admin-login' | 'admin-dashboard' | 'participant-register' | 'participant-tracking';

// FIX: use SocketClient as the type
const SocketContext = createContext<SocketClient | null>(null);
// FIX: use SocketClient as the type
export const useSocket = () => useContext(SocketContext) as SocketClient;

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
    const [trackingStatus, setTrackingStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
    const [geoError, setGeoError] = useState<string | null>(null);
    const trackingIntervalRef = useRef<number | null>(null);


    // Use the real socket server instance
    const socketValue = socketServer;

    // Centralized state management for real-time updates from socket
    useEffect(() => {
        const handleLocationUpdate = (update: LocationUpdate) => {
            setParticipants(prev =>
                prev.map(p =>
                    p.id === update.participantId
                        ? { ...p, location: update.location, lastUpdate: update.timestamp }
                        : p
                )
            );
        };

        const handlePanic = (panicData: { participantId: string; location?: Location }) => {
            setParticipants(prev =>
                prev.map(p =>
                    p.id === panicData.participantId
                        ? {
                              ...p,
                              status: 'panic',
                              location: panicData.location || p.location,
                          }
                        : p
                )
            );
        };
        
        const handleParticipantRegistered = (participant: Participant) => {
            setParticipants(prev => {
                // Prevent adding duplicates
                if (prev.some(p => p.id === participant.id)) {
                    return prev;
                }
                return [...prev, participant];
            });
        };

        const handleParticipantLeft = (data: { participantId: string }) => {
            setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        };
        
        const handleEventAdded = (newEvent: Event) => {
            setEvents(prevEvents => {
                // Prevent adding duplicates.
                if (prevEvents.some(e => e.id === newEvent.id)) {
                    return prevEvents;
                }
                
                // If the new event is active, create a new list with all old events deactivated.
                if (newEvent.active) {
                    const deactivatedOldEvents = prevEvents.map(e => ({ ...e, active: false }));
                    return [...deactivatedOldEvents, newEvent];
                } 
                
                // Otherwise, just add the new (inactive) event to the existing list.
                return [...prevEvents, newEvent];
            });
        };
        
        const handleEventUpdated = (updatedEvent: Event) => {
            setEvents(prevEvents => 
                prevEvents.map(event => {
                    if (event.id === updatedEvent.id) {
                        return updatedEvent;
                    }
                    if (updatedEvent.active) {
                        return { ...event, active: false };
                    }
                    return event;
                })
            );
        };

        const handleEventDeleted = (data: { eventId: string }) => {
            setEvents(prev => prev.filter(e => e.id !== data.eventId));
        };

        const handlePanicCanceled = (data: { participantId: string }) => {
            setParticipants(prev =>
                prev.map(p =>
                    p.id === data.participantId ? { ...p, status: 'tracking' } : p
                )
            );
        };

        socketValue.on('location-update', handleLocationUpdate);
        socketValue.on('panic', handlePanic);
        socketValue.on('participant-registered', handleParticipantRegistered);
        socketValue.on('participant-left', handleParticipantLeft);
        socketValue.on('event-added', handleEventAdded);
        socketValue.on('event-updated', handleEventUpdated);
        socketValue.on('event-deleted', handleEventDeleted);
        socketValue.on('cancel-panic', handlePanicCanceled);


        return () => {
            socketValue.off('location-update', handleLocationUpdate);
            socketValue.off('panic', handlePanic);
            socketValue.off('participant-registered', handleParticipantRegistered);
            socketValue.off('participant-left', handleParticipantLeft);
            socketValue.off('event-added', handleEventAdded);
            socketValue.off('event-updated', handleEventUpdated);
            socketValue.off('event-deleted', handleEventDeleted);
            socketValue.off('cancel-panic', handlePanicCanceled);
        };
    }, [socketValue]);

    // Centralized geolocation tracking logic
    useEffect(() => {
        // Stop any existing tracking interval when the participant changes
        if (trackingIntervalRef.current) {
            clearInterval(trackingIntervalRef.current);
            trackingIntervalRef.current = null;
        }

        if (currentParticipantId) {
            setTrackingStatus('connecting');
            setGeoError('Obteniendo ubicación inicial...');

            const fetchAndSendLocation = () => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const location: Location = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        
                        socketValue.emit('location-update', {
                            participantId: currentParticipantId,
                            location,
                            timestamp: Date.now(),
                        });

                        setTrackingStatus('active');
                        setGeoError(null);
                    },
                    (error) => {
                        console.error("Geolocation error:", error);
                        setTrackingStatus('error');
                        setGeoError(`Error de GPS: ${error.message}`);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            };

            // Get initial location immediately
            fetchAndSendLocation();

            // Then update every 10 seconds
            trackingIntervalRef.current = window.setInterval(fetchAndSendLocation, 10000);
        }

        // Cleanup function
        return () => {
            if (trackingIntervalRef.current) {
                clearInterval(trackingIntervalRef.current);
                trackingIntervalRef.current = null;
            }
        };
    }, [currentParticipantId, socketValue]);


    const handleAdminLogin = () => {
        setView('admin-dashboard');
    };

    const handleParticipantRegister = (participantData: Omit<Participant, 'id' | 'location' | 'status'>) => {
        const newParticipant: Participant = {
            id: `p-${Date.now()}`,
            status: 'tracking',
            ...participantData
        };
        socketValue.emit('participant-registered', newParticipant);
        setCurrentParticipantId(newParticipant.id);
        setView('participant-tracking');
    };

    const navigateTo = (newView: View) => {
        setView(newView);
    };

    const stopTracking = useCallback((participantId: string) => {
        // Notify server/other clients that this participant has stopped tracking
        socketValue.emit('participant-left', { participantId });

        // Reset local state for the current user. This will trigger the useEffect cleanup.
        setCurrentParticipantId(null);
        
        // Navigate home
        setView('home');
    }, [socketValue]);
    
    const addEvent = useCallback((eventData: Omit<Event, 'id'>) => {
        const newEvent: Event = {
            ...eventData,
            id: `evt-${Date.now()}`,
        };
        socketValue.emit('event-added', newEvent);
    }, [socketValue]);

    const updateEvent = useCallback((updatedEvent: Event) => {
        socketValue.emit('event-updated', updatedEvent);
    }, [socketValue]);

    const deleteEvent = useCallback((eventId: string) => {
        socketValue.emit('event-deleted', { eventId });
    }, [socketValue]);

    const triggerCancelPanic = useCallback((participantId: string) => {
        socketValue.emit('cancel-panic', { participantId });
    }, [socketValue]);

    const activeEvents = events.filter(e => e.active);
    
    const currentParticipantData = participants.find(p => p.id === currentParticipantId);

    const renderView = () => {
        switch (view) {
            case 'admin-login':
                return <AdminLogin onLogin={handleAdminLogin} />;
            case 'admin-dashboard':
                return <AdminDashboard 
                    participants={participants}
                    navigateHome={() => navigateTo('home')} 
                    events={events}
                    onAddEvent={addEvent}
                    onUpdateEvent={updateEvent}
                    onDeleteEvent={deleteEvent}
                    onCancelPanic={triggerCancelPanic}
                />;
            case 'participant-register':
                return <ParticipantRegister 
                    onRegister={handleParticipantRegister} 
                    navigateHome={() => navigateTo('home')} 
                    events={activeEvents} 
                />;
            case 'participant-tracking':
                return currentParticipantData ? (
                     <ParticipantTracking 
                        key={currentParticipantData.id} 
                        participant={currentParticipantData} 
                        navigateHome={() => navigateTo('home')}
                        trackingStatus={trackingStatus}
                        geoError={geoError}
                        onStopTracking={stopTracking}
                    />
                ) : null;
            case 'home':
            default:
                return (
                    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
                        <header className="mb-12">
                            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
                                Seguimiento Deportivo en Vivo
                            </h1>
                            <p className="text-gray-600 mt-4 text-lg">Monitoreo en tiempo real para tus eventos deportivos.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:border-blue-500 transition-all duration-300">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Panel de Administrador</h2>
                                <p className="text-gray-600 mb-6">Gestiona eventos, monitorea participantes y garantiza la seguridad desde el centro de control.</p>
                                <button
                                    onClick={() => navigateTo('admin-login')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                                >
                                    Acceder al Panel de Admin
                                </button>
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:border-teal-500 transition-all duration-300">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Panel de Participante</h2>
                                <p className="text-gray-600 mb-6">Únete a un evento, comparte tu ubicación en tiempo real y ten acceso a alertas de emergencia.</p>
                                <button
                                    onClick={() => navigateTo('participant-register')}
                                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                                >
                                    Registrarse como Participante
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <SocketContext.Provider value={socketValue}>
            <main className="min-h-screen bg-gray-100 text-gray-800">
                {renderView()}
            </main>
        </SocketContext.Provider>
    );
};

export default App;