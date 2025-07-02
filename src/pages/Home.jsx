import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Trash2, Edit, Plus, User, Phone, Mail, MapPin, ArrowLeft, X } from 'lucide-react';


const ContactContext = createContext();


const contactReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload, loading: false };
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload.id ? action.payload : contact
        )
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter(contact => contact.id !== action.payload)
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};


const ContactProvider = ({ children }) => {
  const [state, dispatch] = useReducer(contactReducer, {
    contacts: [],
    loading: true,
    error: null
  });

  const API_BASE = 'https://playground.4geeks.com/contact';
  const AGENDA_SLUG = 'mi-agenda'; 

  
  const createAgenda = async () => {
    try {
      await fetch(`${API_BASE}/agendas/${AGENDA_SLUG}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.log('Agenda might already exist');
    }
  };

  
  const fetchContacts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await createAgenda(); // Asegurar que la agenda existe
      const response = await fetch(`${API_BASE}/agendas/${AGENDA_SLUG}/contacts`);
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CONTACTS', payload: data.contacts || [] });
      } else {
        throw new Error('Error al cargar contactos');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

 
  const createContact = async (contactData) => {
    try {
      const response = await fetch(`${API_BASE}/agendas/${AGENDA_SLUG}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const newContact = await response.json();
        dispatch({ type: 'ADD_CONTACT', payload: newContact });
        return newContact;
      } else {
        throw new Error('Error al crear contacto');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

 
  const updateContact = async (id, contactData) => {
    try {
      const response = await fetch(`${API_BASE}/agendas/${AGENDA_SLUG}/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const updatedContact = await response.json();
        dispatch({ type: 'UPDATE_CONTACT', payload: updatedContact });
        return updatedContact;
      } else {
        throw new Error('Error al actualizar contacto');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

 
  const deleteContact = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/agendas/${AGENDA_SLUG}/contacts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        dispatch({ type: 'DELETE_CONTACT', payload: id });
      } else {
        throw new Error('Error al eliminar contacto');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  return (
    <ContactContext.Provider
      value={{
        ...state,
        fetchContacts,
        createContact,
        updateContact,
        deleteContact
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};


const useContacts = () => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContacts debe usarse dentro de ContactProvider');
  }
  return context;
};


const Modal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};


const ContactCard = ({ contact, onEdit, onDelete }) => {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    setShowModal(true);
  };

  const confirmDelete = () => {
    onDelete(contact.id);
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {contact.name}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Phone size={16} className="mr-2" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail size={16} className="mr-2" />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin size={16} className="mr-2" />
                <span>{contact.address}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(contact)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar el contacto "${contact.name}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
};


const ContactsView = ({ onAddContact, onEditContact }) => {
  const { contacts, loading, error, fetchContacts, deleteContact } = useContacts();

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleEdit = (contact) => {
    onEditContact(contact);
  };

  const handleDelete = async (id) => {
    try {
      await deleteContact(id);
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchContacts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Contactos</h1>
        <button
          onClick={onAddContact}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Plus size={20} className="mr-2" />
          Agregar Contacto
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <User size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl text-gray-600 mb-2">No hay contactos</h3>
          <p className="text-gray-500 mb-6">Comienza agregando tu primer contacto</p>
          <button
            onClick={onAddContact}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Agregar Primer Contacto
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};


const AddContactView = ({ contactToEdit, onBack, onSave }) => {
  const { createContact, updateContact } = useContacts();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contactToEdit) {
      setFormData({
        name: contactToEdit.name || '',
        phone: contactToEdit.phone || '',
        email: contactToEdit.email || '',
        address: contactToEdit.address || ''
      });
    }
  }, [contactToEdit]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validación básica
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.address.trim()) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      if (contactToEdit) {
        await updateContact(contactToEdit.id, formData);
      } else {
        await createContact(formData);
      }
      onSave();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-3"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {contactToEdit ? 'Editar Contacto' : 'Agregar Contacto'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: +1 234 567 8900"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: juan@ejemplo.com"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección *
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 123 Calle Principal, Ciudad, País"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : (contactToEdit ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
};


const App = () => {
  const [currentView, setCurrentView] = useState('contacts');
  const [contactToEdit, setContactToEdit] = useState(null);

  const handleAddContact = () => {
    setContactToEdit(null);
    setCurrentView('add');
  };

  const handleEditContact = (contact) => {
    setContactToEdit(contact);
    setCurrentView('add');
  };

  const handleBack = () => {
    setContactToEdit(null);
    setCurrentView('contacts');
  };

  const handleSave = () => {
    setContactToEdit(null);
    setCurrentView('contacts');
  };

  return (
    <ContactProvider>
      <div className="min-h-screen bg-gray-50">
        {currentView === 'contacts' ? (
          <ContactsView
            onAddContact={handleAddContact}
            onEditContact={handleEditContact}
          />
        ) : (
          <AddContactView
            contactToEdit={contactToEdit}
            onBack={handleBack}
            onSave={handleSave}
          />
        )}
      </div>
    </ContactProvider>
  );
};

export default App;