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

const dropdown = document.getElementById("IP-Select");
dropdown.addEventListener("change", (event) => {
    loadServicesFromJSON();
})

async function ping(url, timeout = 200, tries=0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

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
        if (tries > 0) {
            console.log(`failed to ping ${url}`);
            return false;
        }
        else return ping(url, timeout, tries++);
    }
}

function checkIfNetworkExists(network) {
    return !(document.getElementById(network) === null);
}

// Function to create service cards - NOW ASYNC
async function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    let url;
    const network = document.getElementById("IP-Select").value;
    // AWAIT the ping calls
    if (network === "Home") {
        url = `http://192.168.1.174:${service.port}`;
    } else if (network === "Remote") {
        url = service.public_url;
    } else if (network === "Zima") {
        url = `http://172.30.0.1:${service.port}`;
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
    const dropdown = document.getElementById('IP-Select');
    // AWAIT all ping calls
    if (await ping("http://192.168.1.174")) {
        let option = document.createElement('option');
        option.text = "Home Network";
        option.value = "Home";
        option.id = "Home"
        dropdown.add(option)
    }
    if (await ping("http://172.30.0.1")) {
        let option = document.createElement('option');
        option.text = "Zima Network";
        option.value = "Zima";
        option.id = "Zima"
        dropdown.add(option)
    }
    if (await ping("https://home.philips-family.net")) {
        let option = document.createElement('option');
        option.text = "Remote Network";
        option.value = "Remote";
        option.id = "Remote"
        dropdown.add(option)
    }
}

findUsableServers(); // This will run but won't block

window.searchServices = searchServices;