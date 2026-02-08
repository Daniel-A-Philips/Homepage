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

function ping(url) {
     var ImageObject = new Image();
     ImageObject.src = url; //e.g. logo -- mind the caching, maybe use a dynamic querystring
     if(ImageObject.height>0){
       return true;
     } else {
       return false;
     }
}

// Function to create service cards
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';

    var url;
    if (ping("http://192.168.1.174:80/images/zimaos-logo-2.svg")) {
        url = `localhost:${service.port}`;
    } else if (ping("http://172.30.0.1/images/zimaos-logo-2.svg")) {
        url = `172.30.0.1:${service.port}`;
    } else {
        url = service.public_url;
    }

    card.onclick = () => window.open(url, '_blank');

    service.status = ping(url) ? 'online' : 'offline'

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
    populateServices();

}

// Populate services grid
function populateServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = ''; // Clear existing cards
    services.forEach(service => {
        servicesGrid.appendChild(createServiceCard(service));
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
            // Could be used to close modals or return to home
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

window.searchServices = searchServices;