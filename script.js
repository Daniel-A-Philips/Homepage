// Service data
let services = [
    {
        icon: "🏠",
        name: "Server Home",
        description: "Docker and Server Manager",
        port: 80,
        public_url: "https://home.philips-family.net"
    },
    {
        icon: "🎬",
        name: "Stremio",
        description: "Streaming Service",
        port: 8100,
        public_url: "https://stream.philips-family.net"
    },
    {
        icon: "☁️",
        name: "Nextcloud",
        description: "File sync and sharing platform",
        port: 10081,
        public_url: "https://cloud.philips-family.net"
    },
    {
        icon: "🐋",
        name: "Portainer",
        description: "Docker container management",
        port: 9000,
        public_url: "https://portainer.philips-family.net"
    }
];

async function ping(url, timeout = 200) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    console.log(`ping ${url}`); // Fixed: was console.log`ping ${url}`

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache',
            mode: 'no-cors' // This bypasses CORS but gives limited info

        });
        clearTimeout(timeoutId);
        return true;
    } catch (error) {
        clearTimeout(timeoutId);
        return false;
    }
}

// Function to create service cards - NOW ASYNC
async function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    let url;

    // AWAIT the ping calls
    if (await ping("https://192.168.1.174")) {
        url = `https://192.168.1.174:${service.port}`;
    } else if (await ping("https://172.30.0.1")) {
        url = `https://172.30.0.1:${service.port}`;
    } else if (await ping(service.public_url)) {
        url = service.public_url;
    } else {
        return null; // Return null instead of "broken" so we can filter it out
    }

    card.onclick = () => window.open(url, '_blank');

    // AWAIT the ping call for status
    service.status = (await ping(url)) ? 'online' : 'offline';

    card.innerHTML = `
        <span class="service-icon">${service.icon}</span>
        <div class="service-name">${service.name}</div>
        <div class="service-description">${service.description}</div>
        <div class="service-status">
            <span class="${service.status}-status-indicator"></span>
            <span>${service.status}</span>
        </div>
    `;

    return card;
}

async function loadServicesFromJSON() {
    try {
        const response = await fetch('./services.json');
        services = await response.json();
    } catch (error) {
        console.error('Error loading services:', error);
        console.error('Using fallback services');
    }
    await populateServices(); // AWAIT this
}

// Populate services grid - NOW ASYNC
async function populateServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';

    // Use Promise.all to create all cards in parallel
    const cardPromises = services.map(service => createServiceCard(service));
    const cards = await Promise.all(cardPromises);

    // Append only valid cards (filter out null)
    cards.forEach(card => {
        if (card) {
            servicesGrid.appendChild(card);
        }
    });
}

// Add click handlers to navigation buttons
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadServicesFromJSON();
    initNavigation();

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            console.log('ESC pressed');
        }
    });
});

// Optional: Add a simple search function
function searchServices(query) {
    const cards = document.querySelectorAll('.service-card');
    const searchTerm = query.toLowerCase();

    cards.forEach(card => {
        const name = card.querySelector('.service-name').textContent.toLowerCase();
        const description = card.querySelector('.service-description').textContent.toLowerCase();

        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// NOW ASYNC
async function findUsableServers() {
    const home = document.getElementById('Home');
    const zima = document.getElementById('Zima');
    const remote = document.getElementById('Remote');

    // AWAIT all ping calls
    if (await ping("https://192.168.1.174")) home.style.visibility = 'visible';
    if (await ping("https://172.30.0.1")) zima.style.visibility = 'visible';
    if (await ping("https://home.philips-family.net")) remote.style.visibility = 'visible';
}

findUsableServers(); // This will run but won't block

window.searchServices = searchServices;