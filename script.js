
        // Variables globales
        let map = null; // Instancia del mapa de Leaflet
        let marker = null; // Marcador en el mapa

        // Clave de API de OpenWeatherMap 
        // IMPORTANTE: Para usar esta aplicación necesitas obtener tu propia API key gratuita en:
        // https://openweathermap.org/api
        const API_KEY = '1faa29fbb245cdb052603307c406fc77'; // Reemplaza con tu API key real
        const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

        // Elementos del DOM
        const cityInput = document.getElementById('cityInput');
        const weatherForm = document.getElementById('weatherForm');
        const consultBtn = document.getElementById('consultBtn');
        const clearBtn = document.getElementById('clearBtn');
        const loadingMessage = document.getElementById('loadingMessage');
        const successMessage = document.getElementById('successMessage');
        const resultsSection = document.getElementById('resultsSection');
        const weatherTableBody = document.getElementById('weatherTableBody');
        const mapContainer = document.getElementById('mapContainer');
        const cityError = document.getElementById('cityError');

        /**
         * Inicialización de la aplicación
         */
        document.addEventListener('DOMContentLoaded', function() {
            initializeEventListeners();
            cityInput.focus(); // Enfocar el campo de entrada al cargar
        });

        /**
         * Configura todos los event listeners de la aplicación
         */
        function initializeEventListeners() {
            // Event listener para el formulario
            weatherForm.addEventListener('submit', handleFormSubmit);
            
            // Event listener para el botón de limpiar
            clearBtn.addEventListener('click', clearForm);
            
            // Event listener para validación en tiempo real
            cityInput.addEventListener('input', clearValidationErrors);
            
            // Event listener para tecla Enter en el campo de ciudad
            cityInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFormSubmit(e);
                }
            });
        }

        /**
         * Maneja el envío del formulario
         * @param {Event} e - Evento del formulario
         */
        async function handleFormSubmit(e) {
            e.preventDefault();
            
            const city = cityInput.value.trim();
            
            // Validar entrada
            if (!validateInput(city)) {
                return;
            }

            // Mostrar estado de carga
            showLoading(true);
            hideResults();
            clearValidationErrors();

            try {
                // Consultar datos del clima
                const weatherData = await fetchWeatherData(city);
                
                // Mostrar resultados
                displayWeatherData(weatherData);
                displayMap(weatherData.coord.lat, weatherData.coord.lon, weatherData.name);
                
                showSuccess();
                showResults();
                
            } catch (error) {
                console.error('Error al consultar el clima:', error);
                showError(error.message);
            } finally {
                showLoading(false);
            }
        }

        /**
         * Valida la entrada del usuario
         * @param {string} city - Nombre de la ciudad
         * @returns {boolean} - True si es válida, false si no
         */
        function validateInput(city) {
            clearValidationErrors();

            if (!city) {
                showInputError('cityError', 'Por favor, ingresa el nombre de una ciudad');
                cityInput.classList.add('error');
                cityInput.focus();
                return false;
            }

            if (city.length < 2) {
                showInputError('cityError', 'El nombre de la ciudad debe tener al menos 2 caracteres');
                cityInput.classList.add('error');
                cityInput.focus();
                return false;
            }

            return true;
        }

        /**
         * Consulta los datos del clima desde la API
         * @param {string} city - Nombre de la ciudad
         * @returns {Promise<Object>} - Datos del clima
         */
        async function fetchWeatherData(city) {
            // Verificar que se haya configurado una API key válida
            if (API_KEY === 'TU_API_KEY_AQUI') {
                throw new Error('⚠️ API Key no configurada. Por favor obtén una API key gratuita de OpenWeatherMap y configúrala en el código.');
            }

            try {
                // Construir URL de la API con parámetros
                const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=es`;
                
                console.log('Consultando:', url.replace(API_KEY, '***')); // Log para debug (oculta API key)
                
                // Realizar petición a la API
                const response = await fetch(url);
                
                // Manejar diferentes códigos de error HTTP
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`❌ Ciudad "${city}" no encontrada. Verifica el nombre e intenta nuevamente.`);
                    } else if (response.status === 401) {
                        throw new Error('🔑 Error de autenticación: API key inválida o expirada.');
                    } else if (response.status === 429) {
                        throw new Error('⏱️ Demasiadas consultas. Intenta nuevamente en unos minutos.');
                    } else {
                        throw new Error(`🌐 Error del servidor (${response.status}). Intenta nuevamente.`);
                    }
                }
                
                // Parsear respuesta JSON
                const data = await response.json();
                
                console.log('Datos recibidos:', data); // Log para debug
                
                return data;
                
            } catch (error) {
                // Re-lanzar errores de red o parsing
                if (error.message.includes('fetch')) {
                    throw new Error('🌐 Error de conexión. Verifica tu conexión a internet.');
                }
                throw error; // Re-lanzar otros errores
            }
        }

        /**
         * Muestra los datos del clima en la tabla
         * @param {Object} data - Datos del clima de la API
         */
        function displayWeatherData(data) {
            const tbody = weatherTableBody;
            tbody.innerHTML = '';

            // Obtener descripción del clima en mayúsculas para mejor presentación
            const weatherDescription = data.weather[0].description;
            const capitalizedDescription = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);

            // Crear filas de la tabla con los datos reales de la API
            const weatherRows = [
                ['🏙️ Ciudad', `${data.name}, ${data.sys.country}`],
                ['☁️ Condición', capitalizedDescription],
                ['🌡️ Temperatura', `${Math.round(data.main.temp)}°C`],
                ['🤒 Sensación Térmica', `${Math.round(data.main.feels_like)}°C`],
                ['🌡️ Temp. Mínima', `${Math.round(data.main.temp_min)}°C`],
                ['🌡️ Temp. Máxima', `${Math.round(data.main.temp_max)}°C`],
                ['💧 Humedad', `${data.main.humidity}%`],
                ['📊 Presión Atmosférica', `${data.main.pressure} hPa`],
                ['💨 Velocidad del Viento', `${data.wind.speed} m/s`],
                ['🧭 Dirección del Viento', `${data.wind.deg || 'N/A'}°`],
                ['👁️ Visibilidad', `${data.visibility ? (data.visibility / 1000).toFixed(1) + ' km' : 'N/A'}`],
                ['☁️ Nubosidad', `${data.clouds?.all || 'N/A'}%`],
                ['📍 Coordenadas', `${data.coord.lat.toFixed(4)}, ${data.coord.lon.toFixed(4)}`]
            ];

            weatherRows.forEach(([property, value]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${property}</strong></td>
                    <td>${value}</td>
                `;
                tbody.appendChild(row);
            });
        }

        /**
         * Inicializa y muestra el mapa con la ubicación de la ciudad
         * @param {number} lat - Latitud
         * @param {number} lon - Longitud
         * @param {string} cityName - Nombre de la ciudad
         */
        function displayMap(lat, lon, cityName) {
            // Limpiar mapa anterior si existe
            if (map) {
                map.remove();
            }

            // Crear nuevo mapa
            map = L.map('mapContainer').setView([lat, lon], 10);

            // Agregar capa de mapa (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Agregar marcador
            marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup(`<b>${cityName}</b><br>Ubicación consultada`).openPopup();
        }

        /**
         * Limpia el formulario y oculta los resultados
         */
        function clearForm() {
            cityInput.value = '';
            cityInput.focus();
            hideResults();
            clearValidationErrors();
            hideSuccess();
        }

        /**
         * Muestra/oculta el indicador de carga
         * @param {boolean} show - True para mostrar, false para ocultar
         */
        function showLoading(show) {
            loadingMessage.style.display = show ? 'block' : 'none';
            consultBtn.disabled = show;
            
            if (show) {
                consultBtn.textContent = '⏳ Consultando...';
            } else {
                consultBtn.textContent = '🔍 Consultar Clima';
            }
        }

        /**
         * Muestra los resultados
         */
        function showResults() {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }

        /**
         * Oculta los resultados
         */
        function hideResults() {
            resultsSection.style.display = 'none';
        }

        /**
         * Muestra mensaje de éxito
         */
        function showSuccess() {
            successMessage.style.display = 'block';
            setTimeout(() => {
                hideSuccess();
            }, 3000);
        }

        /**
         * Oculta mensaje de éxito
         */
        function hideSuccess() {
            successMessage.style.display = 'none';
        }

        /**
         * Muestra un error de validación en un campo específico
         * @param {string} errorElementId - ID del elemento de error
         * @param {string} message - Mensaje de error
         */
        function showInputError(errorElementId, message) {
            const errorElement = document.getElementById(errorElementId);
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        /**
         * Limpia todos los errores de validación
         */
        function clearValidationErrors() {
            cityInput.classList.remove('error');
            cityError.style.display = 'none';
        }

        /**
         * Muestra un error general
         * @param {string} message - Mensaje de error
         */
        function showError(message) {
            alert(`❌ Error: ${message}`);
        }