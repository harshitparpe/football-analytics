import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',          // proxied to Flask via vite.config.js
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: attach JWT to every request ─────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ────────────────────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── API methods ───────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data)  => client.post('/auth/register', data),
  login:    (data)  => client.post('/auth/login', data),
  me:       ()      => client.get('/auth/me'),
}

export const teamsAPI = {
  getAll:         (params) => client.get('/teams/', { params }),
  getById:        (id)     => client.get(`/teams/${id}`),
  getStats:       (id)     => client.get(`/teams/${id}/stats`),
  getMatches:     (id, params) => client.get(`/teams/${id}/matches`, { params }),
  headToHead:     (a, b)   => client.get('/teams/head-to-head', { params: { a, b } }),
  getConfederations: ()    => client.get('/teams/confederations'),
  getTournamentAverages: (year) => client.get('/teams/tournament-averages',
                                    { params: year ? { year } : {} }),
}

export const playersAPI = {
  getAll:          (params) => client.get('/players/', { params }),
  getById:         (id)     => client.get(`/players/${id}`),
  getTopScorers:   (limit)  => client.get('/players/top-scorers', { params: { limit } }),
  getPenaltyTakers:(limit)  => client.get('/players/penalty-takers', { params: { limit } }),
  getKeepers:      (limit)  => client.get('/players/keepers', { params: { limit } }),
}

export const predictAPI = {
  predictMatch: (team_a_id, team_b_id) =>
    client.post('/predict/match', { team_a_id, team_b_id }),
  getModelInfo: () => client.get('/predict/info'),
}

export const penaltyAPI = {
  getPlayers:  (params)  => client.get('/penalty/players', { params }),
  simulate:    (data)    => client.post('/penalty/simulate', data),
  shootout:    (data)    => client.post('/penalty/shootout', data),
}

export const wc2026API = {
  getFixtures: () => client.get('/wc2026/fixtures'),
  getStandings: () => client.get('/wc2026/standings'),
  getSummary: () => client.get('/wc2026/summary'),
  recordResult: (data) => client.post('/wc2026/result', data),
}

export default client