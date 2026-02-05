import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websiteService } from '../services/websiteService';
import { Globe, Plus, Trash2, Edit, Activity } from 'lucide-react';

const Websites = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWebsite, setNewWebsite] = useState({ name: '', url: '' });

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const data = await websiteService.getWebsites();
      setWebsites(data.websites || []);
    } catch (err) {
      setError('Failed to fetch websites');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    try {
      await websiteService.addWebsite(newWebsite);
      setShowAddModal(false);
      setNewWebsite({ name: '', url: '' });
      fetchWebsites();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add website');
    }
  };

  const handleDeleteWebsite = async (id) => {
    if (!window.confirm('Are you sure you want to delete this website?')) return;

    try {
      await websiteService.deleteWebsite(id);
      fetchWebsites();
    } catch (err) {
      setError('Failed to delete website');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Your Websites</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your websites</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Website</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {websites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No websites yet</h3>
            <p className="text-gray-500 mb-6">Add your first website to start monitoring</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Add Your First Website
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <div
                key={website.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{website.name}</h3>
                      <a
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        {website.url}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Link
                    to={`/website/${website.name}`}
                    className="flex-1 flex items-center justify-center space-x-1 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-100 transition"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Monitor</span>
                  </Link>
                  <button
                    onClick={() => handleDeleteWebsite(website.id)}
                    className="flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Website Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Add New Website</h2>
              <form onSubmit={handleAddWebsite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={newWebsite.name}
                    onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="My Awesome Website"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={newWebsite.url}
                    onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition"
                  >
                    Add Website
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Websites;
