import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './css/styles.css';

interface Location {
    latitude: number,
    longitude: number
}

interface RestaurantInfo {
    id: string,
    name: string,
    address: string,
    location: Location,
    uri: string,
    rating: number,
    imgUri: string
}

interface Review {
    author: string,
    text: string,
    relativetime: string,
}

interface RestaurantDetails {
    openNow: boolean,
    openingHours: string[],
    reviews: Review[]
}

const Home: React.FC = () => {
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<RestaurantInfo[] | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDetails | null>(null);
    const [selectedDistance, setSelectedDistance] = useState<number>(500); // 默认 500m




    useEffect(() => {
        if (navigator.geolocation) {
            if(!localStorage.position) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        localStorage.position = JSON.stringify({latitude: lat, longitude: lon});
                        setLatitude(lat);
                        setLongitude(lon);
                        sendLocationToServer(lat, lon); // Call the function to send data to the server
                    },
                    (error) => {
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                setError("User denied the request for Geolocation.");
                                break;
                            case error.POSITION_UNAVAILABLE:
                                setError("Location information is unavailable.");
                                break;
                            case error.TIMEOUT:
                                setError("The request to get user location timed out.");
                                break;
                            default:
                                setError("An unknown error occurred.");
                                break;
                        }
                    }
                );
            }
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, []);

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = parseInt(event.target.value, 10);
        setSelectedDistance(value);
        if (latitude && longitude) {
            sendLocationToServer(latitude, longitude, value);
        }
    };

    const sendLocationToServer = async (latitude: number, longitude: number, distance: number = 500) => {
        setLoading(true);
        console.log(JSON.stringify({ latitude, longitude, distance }));
        try {
            const response = await fetch('http://localhost:3000/api/res', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ latitude, longitude, distance }),
            });
    
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            const infoList: RestaurantInfo[] = await response.json();
            setResponse(infoList);
        } catch (error) {
            if (error instanceof Error) {
                setError(`Failed to send location data: ${error.message}`);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const getRestaurantDetails = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/res/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data: RestaurantDetails = await response.json();
            setSelectedRestaurant(data);
        } catch (error) {
            if (error instanceof Error) {
                setError(`Failed to get restaurant details: ${error.message}`);
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    const defaultIcon = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });



    return (
        <div id="page-top">
            {/* Navigation */}
            <nav className="navbar navbar-expand-lg navbar-dark fixed-top" id="mainNav">
                <div className="container">
                    <a className="navbar-brand" href="#page-top">
                        <img src="assets/img/navbar-logo2.svg" alt="FoodGuide Logo" />
                    </a>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarResponsive"
                        aria-controls="navbarResponsive"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        Menu
                        <i className="fas fa-bars ms-1"></i>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarResponsive">
                        <ul className="navbar-nav text-uppercase ms-auto py-4 py-lg-0">
                            <li className="nav-item">
                                <a className="nav-link" href="#restaurant">Explore</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Masthead */}
            <header className="masthead">
                <div className="container">
                    <div className="masthead-subheading">Welcome To FoodGuide</div>
                    <div className="masthead-heading text-uppercase">Discover New Restaurants!</div>
                    <a className="btn btn-primary btn-xl text-uppercase" href="#restaurant">Explore</a>
                </div>
            </header>

            {/* restaurant Grid */}
            <section className="page-section bg-light" id="restaurant">
                <div className="container">
                    <div className="text-center">
                        <h2 className="section-heading text-uppercase">Nearby Choices</h2>
                        <h3 className="section-subheading text-muted">Explore top-rated restaurants near you.</h3>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="distance-filter" className="form-label">
                            Filter by distance:
                        </label>
                        <select
                            id="distance-filter"
                            className="form-select"
                            value={selectedDistance}
                            onChange={handleFilterChange}
                        >
                            <option value={500}>500m</option>
                            <option value={1000}>1km</option>
                            <option value={2000}>2km</option>
                            <option value={3000}>3km</option>
                        </select>
                    </div>
                    <div className='location'>
                        {error ? (
                        <p>{error}</p>
                        ) : loading ? (
                        <p>Sending location...</p>
                        ) : latitude && longitude ? (
                        <div>
                            {/* <p>Latitude: {latitude}, Longitude: {longitude}</p> */}
                            {/* {response ? (
                            response.map((place, index) => (
                                <div key={index}>
                                <h3>Restaurant {index + 1}</h3>
                                <pre>{JSON.stringify(place, null, 2)}</pre>
                                </div>
                            ))
                            ) : (
                            <p>No response received</p>
                            )} */}
                        </div>
                        ) : (
                        <p>Loading location...</p>
                        )}
                    </div>
                    <div className="row">
                        {response?.map((place, index) => (
                            <div className="col-lg-4 col-sm-6 mb-4" key={index}>
                                <div className="restaurant-item">
                                    <a className="restaurant-link" data-bs-toggle="modal" href={`#restaurantModal${index + 1}`} onClick={() => getRestaurantDetails(place.id)}>
                                        <div className="restaurant-hover">
                                            <div className="restaurant-hover-content"><i className="fas fa-plus fa-3x"></i></div>
                                        </div>
                                        <img className="img-fluid" src={place.imgUri} alt={place.name} />
                                    </a>
                                    <div className="restaurant-caption">
                                        <div className="restaurant-caption-heading">{place.name}</div>
                                        <div className="restaurant-caption-subheading text-muted">{place.address}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leaflet Map */}
            <section className="map-section">
                <div className="container">
                    <div className="text-center">
                        <h2 className="section-heading text-uppercase">Restaurant Map</h2>
                    </div>
                    {latitude && longitude && response && (
                        <MapContainer
                            center={[latitude, longitude]}
                            zoom={14}
                            style={{ height: '400px', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {response.map((place, index) => (
                                <Marker
                                    key={index}
                                    position={[place.location.latitude, place.location.longitude]}
                                    icon={defaultIcon}
                                >
                                    <Popup>
                                        <div>
                                            <h3>{place.name}</h3>
                                            <p>{place.address}</p>
                                            <p>Rating: {place.rating}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="footer py-4">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-4 text-lg-start">Copyright &copy; FoodGuide 2024</div>
                    </div>
                </div>
            </footer>

            {/* restaurant Modals */}
            {response?.map((place, index) => (
                <div className="restaurant-modal modal fade" id={`restaurantModal${index + 1}`} tabIndex={-1} role="dialog" aria-hidden="true" key={index}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="close-modal" data-bs-dismiss="modal">
                                <img src="assets/img/close-icon.svg" alt="Close modal" />
                            </div>
                            <div className="container">
                                <div className="row justify-content-center">
                                    <div className="col-lg-8">
                                        <div className="modal-body">
                                            <h2 className="text-uppercase">{place.name}</h2>
                                            <p className="item-intro text-muted">{place.address}</p>
                                            <img className="img-fluid d-block mx-auto" src={place.imgUri} alt={place.name} />
                                            <p>{place.rating}</p>
                                            <a href={place.uri}>Website</a>
                                            {selectedRestaurant && selectedRestaurant.openingHours && (
                                            <ul>
                                                {selectedRestaurant.openingHours.map((hour, i) => (
                                                <li key={i}>{hour}</li>
                                                ))}
                                            </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Bootstrap core JS */}
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
        </div>
    );
};

export default Home;
