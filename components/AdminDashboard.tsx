import React, { useState, useEffect, useRef } from 'react';
import type { Participant, Event } from '../types';
import { HomeIcon, UserIcon, WarningIcon, PlusIcon, PencilIcon, TrashIcon } from './icons';

// Leaflet is loaded from CDN, so we declare it to satisfy TypeScript
declare const L: any;

interface AdminDashboardProps {
    participants: Participant[];
    navigateHome: () => void;
    events: Event[];
    onAddEvent: (event: Omit<Event, 'id'>) => void;
    onUpdateEvent: (event: Event) => void;
    onDeleteEvent: (eventId: string) => void;
    onCancelPanic: (participantId: string) => void;
}

const MapComponent: React.FC<{ participants: Participant[] }> = ({ participants }) => {
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Record<string, any>>({});
    const participantIdsOnMap = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = L.map('map').setView([23.6345, -102.5528], 5); // Centered on Mexico
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
        }
        
        const currentParticipantIds = new Set(participants.map(p => p.id));

        // Remove markers for participants who are no longer in the list
        participantIdsOnMap.current.forEach(pid => {
            if (!currentParticipantIds.has(pid)) {
                if (markersRef.current[pid]) {
                    markersRef.current[pid].remove();
                    delete markersRef.current[pid];
                }
            }
        });

        // Add/update markers for current participants
        participants.forEach(p => {
            if (p.location) {
                const marker = markersRef.current[p.id];
                const iconColor = p.status === 'panic' ? 'red' : 'blue';
                const customIcon = L.divIcon({
                    className: `custom-pin ${p.status === 'panic' ? 'animate-pulse' : ''}`,
                    html: `<div style="background-color: ${iconColor};" class="w-4 h-4 rounded-full border-2 border-white shadow-lg"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });
                
                if (marker) {
                    marker.setLatLng([p.location.lat, p.location.lng]);
                    marker.setIcon(customIcon);
                } else {
                    const newMarker = L.marker([p.location.lat, p.location.lng], { icon: customIcon }).addTo(mapRef.current);
                    newMarker.bindTooltip(`<b>${p.name}</b><br>#${p.number}`);
                    markersRef.current[p.id] = newMarker;
                }
            }
        });
        
        participantIdsOnMap.current = currentParticipantIds;

    }, [participants]);

    return <div id="map" className="h-full w-full rounded-lg shadow-lg" />;
};

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'>) => void;
    event?: Event | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, event }) => {
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (event) {
            setName(event.name);
            setIsActive(event.active);
        } else {
            setName('');
            setIsActive(false);
        }
    }, [event, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(name.trim()) {
            onSave({ name, active: isActive });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 text-gray-800">
                <h2 className="text-2xl font-bold mb-4">{event ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Evento</label>
                        <input
                            id="eventName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-100"
                            />
                            <span className="ml-2 text-sm text-gray-700">Marcar como evento activo</span>
                        </label>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-gray-800">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ participants, navigateHome, events, onAddEvent, onUpdateEvent, onDeleteEvent, onCancelPanic }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const handleOpenModalForCreate = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (event: Event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEvent(null);
    };

    const handleSaveEvent = (eventData: Omit<Event, 'id'>) => {
        if (editingEvent) {
            onUpdateEvent({ ...editingEvent, ...eventData });
        } else {
            onAddEvent(eventData);
        }
    };
    
    const handleDeleteEvent = (eventId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.")) {
            onDeleteEvent(eventId);
        }
    };

    const activeEvent = events.find(e => e.active);
    const filteredParticipants = participants.filter(p => p.eventId === activeEvent?.id);
    const panicParticipants = filteredParticipants.filter(p => p.status === 'panic');


    return (
        <>
            <EventModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEvent}
                event={editingEvent}
            />
            <div className="flex flex-col md:flex-row h-screen bg-gray-100 text-gray-800">
                <aside className="w-full md:w-1/3 lg:w-1/4 p-4 flex flex-col space-y-4 bg-white border-r border-gray-200 max-h-screen overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">Panel de Admin</h1>
                        <button onClick={navigateHome} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition">
                            <HomeIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <section className="bg-gray-50 p-4 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2 text-gray-700">Evento Activo</h2>
                        <p className="text-blue-600 font-medium">{activeEvent?.name || 'Ningún evento activo'}</p>
                    </section>

                    <section className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xl text-gray-800">Gestionar Eventos</h3>
                            <button onClick={handleOpenModalForCreate} title="Añadir Nuevo Evento" className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 transition text-white">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                             {events.length > 0 ? events.map(event => (
                                <li key={event.id} className="flex justify-between items-center bg-white p-2 rounded-md border border-gray-200">
                                    <div className="flex items-center space-x-2 min-w-0">
                                        <span className="truncate text-gray-700">{event.name}</span>
                                        {event.active && (
                                            <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                                ACTIVO
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <button onClick={() => handleOpenModalForEdit(event)} title="Editar Evento" className="p-1 text-gray-400 hover:text-gray-700"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteEvent(event.id)} title="Eliminar Evento" className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </li>
                            )) : <p className="text-gray-500 text-sm">Aún no se han creado eventos.</p>}
                        </ul>
                    </section>

                    <section className="bg-gray-50 p-4 rounded-lg flex-grow overflow-y-auto">
                        <h3 className="font-bold text-xl mb-4 text-gray-800">Participantes ({filteredParticipants.length})</h3>
                        <ul className="space-y-3">
                            {filteredParticipants.map(p => (
                                <li key={p.id} className={`flex items-center justify-between p-3 rounded-lg transition ${p.status === 'panic' ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'}`}>
                                    <div className="flex items-center">
                                        {p.status === 'panic' ? <WarningIcon className="w-6 h-6 text-red-500 mr-3"/> : <UserIcon className="w-6 h-6 text-gray-400 mr-3"/>}
                                        <div>
                                            <p className="font-semibold text-gray-800">{p.name}</p>
                                            <p className="text-sm text-gray-500"># {p.number}</p>
                                            {p.lastUpdate && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Actualizado: {new Date(p.lastUpdate).toLocaleTimeString('es-ES')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                     {p.location && p.status === 'tracking' && (
                                        <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                                            CONECTADO
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>

                <main className="flex-grow p-4 relative z-0">
                     {panicParticipants.length > 0 && (
                        <section className="absolute top-4 right-4 z-[500] w-full max-w-sm">
                            <div className="bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg animate-pulse">
                                <h3 className="font-bold text-lg mb-2 text-red-800">¡Alertas de Pánico Activas!</h3>
                                <ul className="space-y-2">
                                    {panicParticipants.map(p => (
                                        <li key={p.id} className="flex justify-between items-center bg-red-200 p-2 rounded">
                                            <div>
                                                <p className="font-semibold text-red-900">{p.name}</p>
                                                <p className="text-sm text-red-700"># {p.number}</p>
                                            </div>
                                            <button
                                                onClick={() => onCancelPanic(p.id)}
                                                className="px-2 py-1 text-xs font-semibold bg-white text-gray-800 rounded hover:bg-gray-100 border border-gray-300 transition"
                                            >
                                                Cancelar Alerta
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}
                     <MapComponent participants={filteredParticipants} />
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;