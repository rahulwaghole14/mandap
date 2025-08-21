

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ContactList.css";

const ContactList = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const token = state?.token;

  const [selectedPhones, setSelectedPhones] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // API Configuration
  const BASE_URL = "https://www.rslsolution.com/mandap-api/api/admin/";
  const MESSAGES_BASE_URL = "https://messagesapi.co.in";
  const USER_ID = "a8bec8c820614d8ba084a55429716a78";
  const DEVICE_NAME = "Aditya";

  // Check authentication on component mount
  useEffect(() => {
    console.log('ContactList: Checking authentication, token:', token ? 'present' : 'missing');
    
    if (!token) {
      console.log('ContactList: No token found, redirecting to login');
      // Redirect to login if no token is present
      navigate('/login', { 
        state: { 
          message: 'Please login to access the contact list' 
        } 
      });
      return;
    }
    
    console.log('ContactList: Token found, fetching contacts');
    // If token exists, fetch contacts
    fetchContacts();
  }, [token, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Early return if no token (additional safety check)
  if (!token) {
    console.log('ContactList: Early return - no token');
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h2 style={styles.welcomeText}>Access Denied</h2>
          </div>
          <p style={styles.loadingText}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const fetchContacts = async () => {
    if (!token) return; // Extra safety check
    
    try {
      setLoading(true);
      const res = await fetch(BASE_URL + 'companies.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check if the response indicates authentication failure
      if (res.status === 401 || res.status === 403) {
        // Token is invalid or expired
        navigate('/login', { 
          state: { 
            message: 'Session expired. Please login again.' 
          } 
        });
        return;
      }
      
      const data = await res.json();
      
      // Extract contact information from companies data
      const contactList = Array.isArray(data) ? data : data.data || [];
      const uniqueContacts = contactList
        .filter(company => company.contact_number && company.poc_name) // Only include companies with contact info
        .map(company => ({
          id: company.id,
          name: company.poc_name,
          phone: company.contact_number
        }))
        .filter((contact, index, self) => 
          // Remove duplicates based on phone number
          index === self.findIndex(c => c.phone === contact.phone)
        );

      setContacts(uniqueContacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      
      // If it's an authentication error, redirect to login
      if (error.message.includes('401') || error.message.includes('403')) {
        navigate('/login', { 
          state: { 
            message: 'Authentication failed. Please login again.' 
          } 
        });
        return;
      }
      
      alert('Failed to fetch contacts from database');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual contact selection
  const handleContactSelect = (phone) => {
    setSelectedPhones(prev => 
      prev.includes(phone) 
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  };

  // Handle select all contacts
  const handleSelectAll = () => {
    if (selectedPhones.length === contacts.length) {
      setSelectedPhones([]); // Deselect all
    } else {
      setSelectedPhones(contacts.map(contact => contact.phone)); // Select all
    }
  };

  // Check if all contacts are selected
  const isAllSelected = contacts.length > 0 && selectedPhones.length === contacts.length;

  const handleSend = async () => {
    if (!token) {
      navigate('/login', { 
        state: { 
          message: 'Session expired. Please login again.' 
        } 
      });
      return;
    }

    if (selectedPhones.length === 0) {
      alert("Please select at least one contact");
      return;
    }

    try {
      let responses = [];

      // Send message to each selected contact
      for (const phone of selectedPhones) {
        // Compulsorily add "91" country code prefix to phone number (without + for API compatibility)
        const formattedPhone = phone.startsWith('+91') ? phone.substring(1) : phone.startsWith('91') ? phone : `91${phone}`;
        
        try {
          let res;

          // Case 1: Message only → NEW URL format
          if (message && !file) {
            const encodedMessage = encodeURIComponent(message); // handle spaces & special chars
            const url = `${MESSAGES_BASE_URL}/chat/sendMessage/${USER_ID}/${DEVICE_NAME}/${formattedPhone}/${encodedMessage}`;
            console.log('Sending message to URL:', url);
            console.log('Parameters:', { USER_ID, DEVICE_NAME, formattedPhone, message });
            res = await axios.get(url);
          }

          // Case 2: Message + File
          else if (message && file) {
            const formData = new FormData();
            formData.append("id", USER_ID);
            formData.append("name", "Frontend User");
            formData.append("phone", formattedPhone);
            formData.append("message", message);
            formData.append("file", file);

            res = await axios.post(
              `${MESSAGES_BASE_URL}/chat/sendMessageFile/${USER_ID}/${DEVICE_NAME}`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
          }

          // Case 3: File only
          else if (!message && file) {
            const formData = new FormData();
            formData.append("id", USER_ID);
            formData.append("name", "Frontend User");
            formData.append("phone", formattedPhone);
            formData.append("file", file);

            res = await axios.post(
              `${MESSAGES_BASE_URL}/chat/sendFile/${USER_ID}/${DEVICE_NAME}`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
          }

          responses.push({ phone: formattedPhone, success: true, data: res.data });
        } catch (error) {
          responses.push({ phone: formattedPhone, success: false, error: error.message });
        }
      }

      // Format response to show only status and message
      const formattedResponses = responses.map(resp => {
        if (resp.success) {
          return `${resp.phone}: ✅ Success - ${resp.data?.message || 'Message sent successfully'}`;
        } else {
          return `${resp.phone}: ❌ Failed - ${resp.error}`;
        }
      }).join('\n');
      
      setResponse(formattedResponses);
    } catch (err) {
      console.error(err);
      setResponse("Error: " + err.message);
    }
  };

  // Show all contacts in scrollable table
  const displayedContacts = contacts;

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h2 style={styles.welcomeText}>Send Message or File</h2>
            <button 
              onClick={() => navigate('/home', { state: { token } })}
              style={styles.backButton}
            >
              Back to Home
            </button>
          </div>
          <p style={styles.loadingText}>Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* ✅ Top Bar */}
        <div style={styles.topBar}>
          <h2 style={styles.welcomeText}>Send Message or File</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={fetchContacts}
              style={styles.refreshButton}
            >
              Refresh
            </button>
            <button 
              onClick={() => navigate('/home', { state: { token } })}
              style={styles.backButton}
            >
              Back to Home
            </button>
          </div>
        </div>

        <div style={styles.contentWrapper}>
          {/* ✅ Left Side - Contact List */}
          <div style={styles.contactSection}>
            <h3 style={styles.sectionTitle}>Contact List</h3>
            
            {/* Contact count and selection info */}
            <div style={styles.contactCount}>
              Total {contacts.length} contact{contacts.length !== 1 ? 's' : ''} - 
              Selected {selectedPhones.length} contact{selectedPhones.length !== 1 ? 's' : ''}
            </div>

            {/* Select All Button */}
            <div style={styles.selectAllContainer}>
              <label style={styles.selectAllLabel}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  style={styles.checkbox}
                />
                <span style={styles.selectAllText}>
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </span>
              </label>
            </div>

            {/* Scrollable Table Container */}
            <div style={styles.tableContainer}>
              <table style={styles.contactTable}>
                <thead>
                  <tr>
                    <th style={styles.checkboxHeader}>Select</th>
                    <th style={styles.tableHeader}>Name</th>
                    <th style={styles.tableHeader}>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedContacts.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={styles.noDataCell}>
                        No contacts found
                      </td>
                    </tr>
                  ) : (
                    displayedContacts.map((contact) => (
                      <tr
                        key={contact.id}
                        style={{
                          ...styles.tableRow,
                          ...(selectedPhones.includes(contact.phone) ? styles.selectedRow : {})
                        }}
                      >
                        <td style={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={selectedPhones.includes(contact.phone)}
                            onChange={() => handleContactSelect(contact.phone)}
                            style={styles.checkbox}
                          />
                        </td>
                        <td style={styles.tableCell}>{contact.name}</td>
                        <td style={styles.tableCell}>{contact.phone}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ Right Side - Message Form */}
          <div style={styles.messageSection}>
            <h3 style={styles.sectionTitle}>Send Message</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>File:</label>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])}
                style={styles.fileInput}
              />
            </div>

            <button 
              onClick={handleSend} 
              style={{
                ...styles.sendButton,
                ...(selectedPhones.length === 0 && styles.disabledButton)
              }}
              disabled={selectedPhones.length === 0}
            >
              Send to {selectedPhones.length} Contact{selectedPhones.length !== 1 ? 's' : ''}
            </button>

            {response && (
              <div style={styles.responseContainer}>
                <h4 style={styles.responseTitle}>Response:</h4>
                <pre style={styles.responseText}>{response}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles matching the Home screen
const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FF7F50, #FFEC4E)',
    padding: '40px 0',
    fontFamily: 'Roboto, sans-serif',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    fontFamily: 'Roboto, sans-serif',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  welcomeText: {
    margin: 0,
    color: '#333',
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: 'Roboto, sans-serif',
  },
  refreshButton: {
    background: '#2196F3',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
  },
  backButton: {
    background: '#666',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
  },
  contentWrapper: {
    display: 'flex',
    gap: '20px',
  },
  contactSection: {
    width: '450px',
    background: '#fff',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
  },
  messageSection: {
    flex: 1,
    background: '#fff',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    border: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#FF7F50',
    textAlign: 'center',
    borderBottom: '1px solid #ddd',
    paddingBottom: '8px',
    fontFamily: 'Roboto, sans-serif',
  },
  contactCount: {
    marginBottom: '15px',
    color: '#666',
    fontSize: '14px',
    textAlign: 'center',
    fontFamily: 'Roboto, sans-serif',
  },
  selectAllContainer: {
    marginBottom: '15px',
    padding: '10px',
    background: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #e9ecef',
  },
  selectAllLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif',
  },
  selectAllText: {
    marginLeft: '8px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  tableContainer: {
    height: '250px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '5px',
    background: '#fafafa',
  },
  contactTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    background: '#fff',
  },
  checkboxHeader: {
    width: '50px',
    background: '#f5f5f5',
    fontWeight: 'bold',
    color: '#333',
    padding: '10px 8px',
    textAlign: 'center',
    borderBottom: '1px solid #ddd',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    fontFamily: 'Roboto, sans-serif',
  },
  tableHeader: {
    background: '#f5f5f5',
    fontWeight: 'bold',
    color: '#333',
    padding: '10px 8px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    fontFamily: 'Roboto, sans-serif',
  },
  tableRow: {
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  selectedRow: {
    background: '#d1ffd1',
  },
  checkboxCell: {
    padding: '10px 8px',
    borderBottom: '1px solid #eee',
    textAlign: 'center',
    fontFamily: 'Roboto, sans-serif',
  },
  tableCell: {
    padding: '10px 8px',
    borderBottom: '1px solid #eee',
    fontFamily: 'Roboto, sans-serif',
  },
  noDataCell: {
    textAlign: 'center',
    color: '#777',
    padding: '20px',
    fontFamily: 'Roboto, sans-serif',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Roboto, sans-serif',
  },
  textarea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    resize: 'none',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  fileInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
  },
  sendButton: {
    width: '100%',
    padding: '12px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: 'Roboto, sans-serif',
    marginBottom: '15px',
  },
  disabledButton: {
    background: '#ccc',
    cursor: 'not-allowed',
  },
  responseContainer: {
    marginTop: '15px',
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  responseTitle: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: 'Roboto, sans-serif',
  },
  responseText: {
    margin: 0,
    background: '#fff',
    padding: '10px',
    borderRadius: '3px',
    whiteSpace: 'pre-wrap',
    fontSize: '12px',
    fontFamily: 'monospace',
    border: '1px solid #ddd',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
    fontFamily: 'Roboto, sans-serif',
  },
};

export default ContactList;
