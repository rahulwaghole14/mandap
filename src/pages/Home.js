import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BASE_URL = 'https://www.rslsolution.com/mandap-api/api/admin/';

const Home = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const token = state?.token;

  const [companies, setCompanies] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedTaluka, setSelectedTaluka] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Added search state

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const COMPANIES_PER_PAGE = 5;

  // ✅ Auth Guard: Redirect to login if no token
  useEffect(() => {
    if (!token) {
      navigate('/login', {
        state: { message: 'Please login to access the dashboard' }
      });
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return; // safety
    fetchFilters();
    fetchCompanies();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
    if (!token) return;
    fetchCompanies();
  }, [selectedTaluka, selectedServices, token]);

  const fetchFilters = async () => {
    if (!token) return;
    try {
      const [talRes, servRes] = await Promise.all([
        fetch(BASE_URL + 'new_tal.php', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(BASE_URL + 'new_serv.php', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setTalukas(await talRes.json());
      setServices(await servRes.json());
    } catch {
      alert('Failed to fetch filters');
    }
  };

  const fetchCompanies = async () => {
    if (!token) return;
    let query = '';
    if (selectedTaluka) query += `taluka_id=${selectedTaluka}&`;
    selectedServices.forEach((s) => {
      query += `service_ids[]=${s}&`;
    });

    try {
      const res = await fetch(BASE_URL + `companies.php?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('Failed to fetch companies');
    }
  };

  const handleDelete = async (company_id) => {
    if (!token) {
      navigate('/login', { state: { message: 'Session expired. Please login again.' } });
      return;
    }
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        const res = await fetch(BASE_URL + 'delete_company.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ company_id }),
        });

        if (res.ok) {
          alert('Company deleted successfully');
          fetchCompanies();
        } else {
          const err = await res.json();
          alert(`Failed to delete company: ${err.error || err.message}`);
        }
      } catch {
        alert('Error deleting company');
      }
    }
  };

  const handleEditClick = (company) => {
    if (!token) {
      navigate('/login', { state: { message: 'Session expired. Please login again.' } });
      return;
    }
    const serviceIds = company.services
      ? company.services
          .split(',')
          .map((s) => s.trim())
          .map((name) => {
            const found = services.find((srv) => srv.name === name);
            return found ? parseInt(found.id) : null;
          })
          .filter((id) => id !== null)
      : [];

    navigate('/edit', {
      state: {
        company: {
          ...company,
          taluka_id: company.taluka_id || '',
          service_ids: serviceIds,
        },
        token,
      },
    });
  };

  const handleLogout = () => {
    navigate('/');
  };

  // ✅ Filtered Companies by search
  const filteredCompanies = companies.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.poc_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * COMPANIES_PER_PAGE,
    currentPage * COMPANIES_PER_PAGE
  );

  // Early return UI while redirecting if no token
  if (!token) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <h2 style={styles.welcomeText}>Access Denied</h2>
          </div>
          <p style={styles.noData}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* ✅ Top Bar */}
        <div style={styles.topBar}>
          <h2 style={styles.welcomeText}>Welcome, Admin</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/contacts', { state: { token } })} 
              style={{
                background: '#4CAF50',
                color: '#fff',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              Contacts
            </button>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        <div style={styles.contentWrapper}>
          {/* ✅ Left Filter Panel */}
          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>Filters</h3>

            {/* Taluka Filter */}
            <div style={styles.filterBlock}>
              <label style={styles.label}>Taluka</label>
              <select
                style={styles.select}
                value={selectedTaluka}
                onChange={(e) => setSelectedTaluka(e.target.value)}
              >
                <option value="">All Talukas</option>
                {talukas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Services Filter */}
            <div style={styles.filterBlock}>
              <label style={styles.label}>Services</label>
              <div style={styles.servicesContainer}>
                {services.map((service) => (
                  <label
                    key={service.id}
                    style={styles.checkboxLabel}
                    onMouseEnter={(e) =>
                      (e.target.style.background = '#f1f1f1')
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = 'transparent')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() =>
                        setSelectedServices((prev) =>
                          prev.includes(service.id)
                            ? prev.filter((id) => id !== service.id)
                            : [...prev, service.id]
                        )
                      }
                    />
                    {service.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Buttons */}
            <div style={styles.filterButtons}>
              <button
                style={styles.clearFilterButton}
                onClick={() => {
                  setSelectedTaluka('');
                  setSelectedServices([]);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* ✅ Right Side Company List */}
          <div style={styles.companyListWrapper}>
            {/* ✅ Search Bar */}
            <input
              type="text"
              placeholder="Search by Firm or Contact Name"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.searchInput}
            />

            {/* ✅ Member List Title */}
            <h3 style={styles.memberListTitle}>Member List</h3>

            {paginatedCompanies.length === 0 ? (
              <p style={styles.noData}>No companies found.</p>
            ) : (
              paginatedCompanies.map((c) => (
                <div key={c.id} style={styles.companyCard}>
                  <h3 style={styles.companyName}>{c.company_name}</h3>
                  <p>
                    <strong>Contact Name:</strong> {c.poc_name}
                  </p>
                  <p>
                    <strong>Contact:</strong> {c.contact_number}
                  </p>
                  <p>
                    <strong>Email:</strong> {c.email}
                  </p>
                  <p>
                    <strong>Taluka:</strong> {c.taluka}
                  </p>
                  <p>
                    <strong>Services:</strong> {c.services || 'N/A'}
                  </p>

                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.editButton}
                      onClick={() => handleEditClick(c)}
                    >
                      Edit
                    </button>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* ✅ Pagination */}
            <div style={styles.pagination}>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
                style={styles.paginationButton}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {currentPage} of{' '}
                {Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev <
                    Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE)
                      ? prev + 1
                      : prev
                  )
                }
                disabled={
                  currentPage >=
                  Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE)
                }
                style={styles.paginationButton}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Same styles as you provided, just added search bar & title
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

  /** ✅ Top Bar **/
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
  logoutButton: {
    background: '#ff4d4d',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },

  /** ✅ Left-Right Layout **/
  contentWrapper: {
    display: 'flex',
    gap: '20px',
  },
  filterSection: {
    width: '250px',
    background: '#f9f9f9',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: '20px', // ✅ stays fixed while scrolling
    height: 'fit-content',
  },
  filterBlock: { marginBottom: '15px' },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#444',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  checkboxContainer: {
    maxHeight: '150px',
    overflowY: 'auto',
    padding: '5px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    background: '#fff',
  },
  checkboxLabel: { display: 'block', marginBottom: '6px', fontSize: '14px' },

  /** ✅ Right Side Company List **/
  companyListWrapper: {
    flex: 1,
  },
  companyCard: {
    background: '#fff',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  },
 companyName: {
  margin: '0 0 8px 0',
  color: '#FF7F50',
  fontSize: '22px',          // ✅ Bigger font for visibility
  fontWeight: 'bold',        // ✅ Bold for emphasis
  textTransform: 'uppercase',// ✅ Makes it stand out (optional)
  letterSpacing: '0.5px',    // ✅ Slight spacing for better readability
  fontFamily: 'Roboto, sans-serif',
  borderBottom: '2px solid #FF7F50', // ✅ Underline accent for focus
  paddingBottom: '4px',
},

  noData: { textAlign: 'center', color: '#777' },
  buttonGroup: { marginTop: '10px', display: 'flex', gap: '10px' },
  editButton: {
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
     fontFamily: 'Roboto, sans-serif',
  },
  deleteButton: {
    background: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
     fontFamily: 'Roboto, sans-serif',
  },

  /** ✅ Pagination **/
  pagination: {
    textAlign: 'center',
    marginTop: '20px',
  },
  paginationButton: {
    margin: '0 5px',
    padding: '8px 12px',
    backgroundColor: '#FF7F50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
     fontFamily: 'Roboto, sans-serif',
  },
  pageInfo: {
    margin: '0 10px',
    fontWeight: 'bold',
  },
   /** Left Filter Panel **/
  filterSection: {
    width: '260px',
    background: '#fff',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: '20px',
    height: 'fit-content',
    border: '1px solid #eee',
  },
  filterTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#FF7F50',
    textAlign: 'center',
    borderBottom: '1px solid #ddd',
    paddingBottom: '8px',
     fontFamily: 'Roboto, sans-serif',
  },
  filterBlock: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
    fontSize: '14px',
    fontFamily: 'Roboto, sans-serif',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    outline: 'none',
  },
  checkboxContainer: {
    maxHeight: '160px',
    overflowY: 'auto',
    padding: '5px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    background: '#fdfdfd',
  },
  checkboxLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    padding: '4px 6px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  filterButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  applyFilterButton: {
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  clearFilterButton: {
    background: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
     fontFamily: 'Roboto, sans-serif',
  },
  searchInput: {
    width: '100%', // ✅ takes full width of the company list wrapper
    maxWidth: '100%', // ✅ ensures alignment with card width
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    fontFamily: 'Roboto, sans-serif',
    boxSizing: 'border-box', // ✅ ensures proper alignment
  },
  memberListTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FF7F50',
    marginBottom: '15px',
    fontFamily: 'Roboto, sans-serif',
  },
};

export default Home;
