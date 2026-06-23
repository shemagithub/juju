// destinations img - Rwanda themed
import tour4 from "../assets/images/tour/Tokyo.png"; // Butare
import tour5 from "../assets/images/tour/bali-1.png"; // Musanze/Volcanoes NP
import tour6 from "../assets/images/tour/bangkok.png"; // Gisenyi
import tour7 from "../assets/images/tour/cancun.png"; // Kibungo
import tour8 from "../assets/images/tour/nah-trang.png"; // Rwamagana
import tour9 from "../assets/images/tour/phuket.png"; // Gitarama
import tour10 from "../assets/images/tour/paris.png"; // Nyamata
import tour11 from "../assets/images/tour/malaysia.png"; // Kigali

// populars img - Rwanda themed
import Anchorage from "../assets/images/popular/Anchorage To La Paz.jpg"; // Kigali To Gisenyi
import Singapore from "../assets/images/popular/Discover Singapore.png"; // Discover Kigali
import Kiwiana from "../assets/images/popular/Kiwiana Panorama.jpg"; // Rwanda Panorama
import Quito from "../assets/images/popular/Anchorage To Quito.jpg"; // Kigali To Musanze
import Cuzco from "../assets/images/popular/Cuzco To Anchorage.jpg"; // Butare To Kigali
import Ushuaia from "../assets/images/popular/Anchorage To Ushuaia.jpg"; // Kigali To Akagera
import Santiago from "../assets/images/popular/Anchorage To Santiago.jpg"; // Kigali To Nyungwe
import Explorer from "../assets/images/popular/LA Explorer.jpg"; // Rwanda Explorer

// tour detail img
import image1 from "../assets/images/new/1.jpg";
import image2 from "../assets/images/new/2.jpg";
import image3 from "../assets/images/new/3.jpg";
import image4 from "../assets/images/new/4.jpg";
import image5 from "../assets/images/new/5.jpg";
import image6 from "../assets/images/new/6.jpg";
import image7 from "../assets/images/new/7.jpg";
import image8 from "../assets/images/new/8.jpg";

export const destinationsData = [
  {
    id: 0,
    name: "Musanze",
    tours: "5 tours and activities",
    image: tour5,
    link: "tour-name",
    shortDes: "",
  },
  {
    id: 1,
    name: "Butare",
    tours: "9 tours and activities",
    image: tour4,
    link: "tour-name",
  },

  {
    id: 2,
    name: "Gisenyi",
    tours: "5 tours and activities",
    image: tour6,
    link: "tour-name",
  },

  {
    id: 3,
    name: "Kibungo",
    tours: "4 tours and activities",
    image: tour7,
    link: "tour-name",
  },
  {
    id: 4,
    name: "Rwamagana",
    tours: "9 tours and activities ",
    image: tour8,
    link: "tour-name",
  },
  {
    id: 5,
    name: "Gitarama",
    tours: "4 tours and activities",
    image: tour9,
    link: "tour-name",
  },
  {
    id: 6,
    name: "Nyamata",
    tours: "6 tours and activities",
    image: tour10,
    link: "tour-name",
  },
  {
    id: 7,
    name: "Kigali",
    tours: "4 tours and activities",
    image: tour11,
    link: "tour-name",
  },
];

export const popularsData = [
  {
    id: 0,
    title: "Discover Singapore",
    image: Singapore,
    location: "Kigali, Rwanda",
    category: ["Escorted Tour", "Rail Tour"],
    days: "5 days - 4 nights",
    price: 100,
    afterDiscount: 92,
    rating: 3,
    reviews: 5,
  },
  {
    id: 1,
    title: "Kiwiana Panorama",
    image: Kiwiana,
    location: "Kigali, Rwanda",
    category: ["River Cruise", "Wildlife"],
    days: "2 days - 1 nights",
    price: 87,
    afterDiscount: 82,
    rating: 4,
    reviews: 9,
  },
  {
    id: 2,
    title: "Anchorage To Quito",
    image: Quito,
    location: "Kigali, Rwanda",
    category: ["Escorted Tour", "River Cruise"],
    days: "2 days - 1 nights",
    price: 87,
    afterDiscount: 82,
    rating: 4,
    reviews: 9,
  },
  {
    id: 3,
    title: "Anchorage To La Paz",
    image: Anchorage,
    location: "Kigali, Rwanda",
    category: ["River Cruise", "Rail Tour"],
    days: "unlimited",
    price: 434,
    afterDiscount: 0,
    rating: 5,
    reviews: 20,
  },
  {
    id: 4,
    title: "Cuzco To Anchorage",
    image: Cuzco,
    location: "Kigali, Rwanda",
    category: ["River Cruise", "Tour & Cruise"],
    days: "1 days - 9 hours",
    price: 395,
    afterDiscount: 0,
    rating: 3,
    reviews: 12,
  },
  {
    id: 5,
    title: "Anchorage To Ushuaia",
    image: Ushuaia,
    location: "Kigali, Rwanda",
    category: ["Escorted Tour", "Wildlife"],
    days: "5 days - 4 nights",
    price: 93,
    afterDiscount: 0,
    rating: 3,
    reviews: 12,
  },
  {
    id: 6,
    title: "Anchorage To Santiago",
    image: Santiago,
    location: "Kigali, Rwanda",
    category: ["Escorted Tour", "Wildlife"],
    days: "1 day - 1 night",
    price: 42,
    afterDiscount: 0,
    rating: 5,
    reviews: 18,
  },
  {
    id: 7,
    title: "LA Explorer",
    image: Explorer,
    location: "Kigali, Rwanda",
    category: ["Rail Tour", "Tour & Cruise"],
    days: "1 night",
    price: 99,
    afterDiscount: 0,
    rating: 4,
    reviews: 22,
  },
];

export const tourDetails = {
  title: "Beautiful Rwanda Safari Adventure",
  des: ` Rwanda, also known as the land of a thousand hills, has plenty to offer to travelers from across the globe. Experience gorilla trekking, wildlife safaris, and cultural tours in this beautiful East African nation. We understand that theory is important to build a solid foundation, we understand that theory alone isn't going to get the job done so that's why this is packed with practical hands-on examples that you can  follow step by step.`,
  price: "280.00",
  rating: " 4.5",
  reviews: "365 reviews",
  tourInfo: [
    '<strong className="font-bold"> Place Covered</strong>: Kigali - Musanze',
    ' <strong className="font-bold">Duration:</strong>5 Days, 4 Nights',
    '<strong className="font-bold">Start Point:</strong> Kigali International Airport',
    '<strong className="font-bold">End Point:</strong>  Kigali International Airport',
  ],

  highlights: [
    " Experience a delightful tropical getaway with a luxurious stay and witness the picture-perfect beaches, charming waterfalls and so much more",
    " Dependent on so extremely delivered by. Yet no jokes  worse her why. Bed one supposing breakfast day fulfilled off depending questions.",
    " Whatever boy her exertion his extended. Ecstatic  followed handsome drawings entirely Mrs one yet  outweigh.",
    "Meant balls it if up doubt small purse. Required his  you put the outlived answered position. A pleasure exertion if believed provided to.",
  ],

  itinerary: [
    {
      title: `<span class="me-1 fw-bold">Day 1:</span>  Airport Pick Up `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore Kigali and get settled in.`,
    },

    {
      title: `<span class="me-1 fw-bold">Day 2:</span>  Temples & River Cruise `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in. `,
    },
    {
      title: `<span class="me-1 fw-bold">Day 3:</span>  Massage & Overnight Train`,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore Kigali and get settled in.`,
    },
    {
      title: `<span class="me-1 fw-bold">Day 4:</span>  Khao Sok National Park `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore Kigali and get settled in.`,
    },
    {
      title: `<span class="me-1 fw-bold">Day 5:</span>  Travel to Koh Phangan `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.
      `,
    },
    {
      title: `<span class="me-1 fw-bold">Day 6:</span> Morning Chill & Muay Thai Lesson `,
      des: `Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.
      `,
    },
  ],

  included: [
    "Comfortable stay for 4 nights in your preferred category Hotels",
    "Professional English speaking guide to help you explore the cities",
    "Breakfast is included as mentioned in Itinerary.",
    "Per Peron rate on twin sharing basis",
    "Entrance Tickets to Genting Indoor Theme Park    ",
    "All Tours & Transfers on Seat In Coach Basis ",
    "Visit Akagera National Park with Wildlife Safari Pass    ",
  ],
  exclusion: [
    "Lunch and dinner are not included in CP plans",
    "Any other services not specifically mentioned in the inclusions",
    "Medical and Travel insurance",
    "Airfare is not included ",
    "Early Check-In & Late Check-Out ",
    "Anything which is not specified in Inclusions    ",
  ],

  images: [
    {
      original: image1,
      thumbnail: image1,
    },
    {
      original: image2,
      thumbnail: image2,
    },
    {
      original: image3,
      thumbnail: image3,
    },
    {
      original: image4,
      thumbnail: image4,
    },
    {
      original: image5,
      thumbnail: image5,
    },

    {
      original: image6,
      thumbnail: image6,
    },
    {
      original: image7,
      thumbnail: image7,
    },
    {
      original: image8,
      thumbnail: image8,
    },
  ],
};

export const location = [
  "Kigali",
  "Musanze",
  "Butare",
  "Gisenyi",
  "Kibungo",
  "Rwamagana",
  "Gitarama",
  "Nyamata",
];

export const Categories = [
  "History",
  "Calture",
  "Netural",
  "Urban Tour",
  "Relax",
];

export const Duration = ["1-3 Days", "3-5 Days", "5-7 Days", "7-10 Day"];
export const PriceRange = [
  "$ 0 - $50",
  "$ 50 - $ 100",
  "$ 100 - $ 200",
  "$ 200 - ₹ $ 400",
  "$ 400 - ₹ $ 800",
];

export const Ratings = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];
