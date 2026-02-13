let services;

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
        if (tries > 5) {
            console.log(`failed to ping ${url}`);
            return false;
        }
        else return ping(url, timeout, tries += 1);
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
        url = `http://zimaos.local:${service.port}`;
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
document.addEventListener('DOMContentLoaded', async () => {
    await findUsableServers();  // Wait for network detection FIRST
    loadServicesFromJSON();     // THEN load services
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

// NOW ASYNC - pings run in parallel for faster detection
async function findUsableServers() {
    const dropdown = document.getElementById('IP-Select');

    const networks = [
        { url: "http://zimaos.local", text: "Home Network", value: "Home" },
        { url: "http://172.30.0.1", text: "Zima Network", value: "Zima" },
        { url: "https://home.philips-family.net", text: "Remote Network", value: "Remote" },
    ];

    const results = await Promise.all(
        networks.map(async (net) => ({ ...net, reachable: await ping(net.url) }))
    );

    results.forEach((net) => {
        if (net.reachable) {
            let option = document.createElement('option');
            option.text = net.text;
            option.value = net.value;
            option.id = net.value;
            dropdown.add(option);
        }
    });
}

// findUsableServers is now called inside DOMContentLoaded

window.searchServices = searchServices;