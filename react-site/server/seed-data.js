/* The clinics, services and doctors — the same data as database/schema.sql
   in the base site. `npm run seed` loads it into MongoDB. */

// Every doctor can log in at /doctor/login with this TEST password (same as
// the base site's schema.sql). 
export const DOCTOR_TEST_PASSWORD = 'Doctor123'

export const branches = [
  {
    "_id": 1,
    "slug": "orchard",
    "name": "Orchard",
    "address": "123 Orchard Road, #05-12, Singapore 238888",
    "phone": "+65 6123 4567",
    "mapImg": "map-orchard.svg",
    "hours": {
      "1": {
        "open": "09:00",
        "close": "19:00"
      },
      "2": {
        "open": "09:00",
        "close": "19:00"
      },
      "3": {
        "open": "09:00",
        "close": "19:00"
      },
      "4": {
        "open": "09:00",
        "close": "19:00"
      },
      "5": {
        "open": "09:00",
        "close": "19:00"
      },
      "6": {
        "open": "09:00",
        "close": "14:00"
      }
    }
  },
  {
    "_id": 2,
    "slug": "tampines",
    "name": "Tampines",
    "address": "8 Tampines Central 1, #03-21, Singapore 529536",
    "phone": "+65 6234 5678",
    "mapImg": "map-tampines.svg",
    "hours": {
      "1": {
        "open": "10:00",
        "close": "20:00"
      },
      "2": {
        "open": "10:00",
        "close": "20:00"
      },
      "3": {
        "open": "10:00",
        "close": "20:00"
      },
      "4": {
        "open": "10:00",
        "close": "20:00"
      },
      "5": {
        "open": "10:00",
        "close": "20:00"
      },
      "6": {
        "open": "09:00",
        "close": "17:00"
      },
      "0": {
        "open": "09:00",
        "close": "13:00"
      }
    }
  },
  {
    "_id": 3,
    "slug": "jurong-east",
    "name": "Jurong East",
    "address": "50 Jurong Gateway Road, #04-07, Singapore 608549",
    "phone": "+65 6345 6789",
    "mapImg": "map-jurong.svg",
    "hours": {
      "1": {
        "open": "09:00",
        "close": "18:30"
      },
      "2": {
        "open": "09:00",
        "close": "18:30"
      },
      "3": {
        "open": "09:00",
        "close": "18:30"
      },
      "4": {
        "open": "09:00",
        "close": "18:30"
      },
      "5": {
        "open": "09:00",
        "close": "18:30"
      },
      "6": {
        "open": "09:00",
        "close": "16:00"
      }
    }
  }
]

export const services = [
  {
    "_id": 1,
    "slug": "general-dentistry",
    "name": "General Dentistry",
    "summary": "Check-ups, scaling and polishing, X-rays and simple fillings.",
    "priceFrom": 45
  },
  {
    "_id": 2,
    "slug": "braces",
    "name": "Braces / Invisalign",
    "summary": "Straightening teeth with fixed braces or clear removable aligners.",
    "priceFrom": 5500
  },
  {
    "_id": 3,
    "slug": "root-canal",
    "name": "Root Canal",
    "summary": "Clears infection inside a tooth so it can be saved instead of taken out.",
    "priceFrom": 1100
  },
  {
    "_id": 4,
    "slug": "implants",
    "name": "Dental Implants",
    "summary": "A titanium post and crown that replace a missing tooth.",
    "priceFrom": 4500
  },
  {
    "_id": 5,
    "slug": "crowns-bridges",
    "name": "Crowns and Bridges",
    "summary": "Caps for cracked or worn teeth, and bridges that fill a gap.",
    "priceFrom": 1300
  },
  {
    "_id": 6,
    "slug": "dentures",
    "name": "Dentures",
    "summary": "Removable replacements for several missing teeth or a full arch.",
    "priceFrom": 700
  }
]

export const doctors = [
  {
    "_id": 1,
    "name": "Dr. Tan Wei Ling",
    "specialty": "general",
    "role": "Family Dentistry",
    "bio": "Graduated from NUS Dentistry in 2011 and has spent her career in family practice.",
    "photo": "doctor-general-1.jpg",
    "serviceIds": [
      1
    ]
  },
  {
    "_id": 2,
    "name": "Dr. Marcus Lim",
    "specialty": "general",
    "role": "Preventive Care",
    "bio": "Twelve years of experience and a strong preference for catching problems early.",
    "photo": "doctor-general-2.jpg",
    "serviceIds": [
      1
    ]
  },
  {
    "_id": 3,
    "name": "Dr. Daniel Ong",
    "specialty": "general",
    "role": "Paediatric Dentistry",
    "bio": "Trained in Melbourne; makes first dental visits something children do not dread.",
    "photo": "doctor-general-3.jpg",
    "serviceIds": [
      1
    ]
  },
  {
    "_id": 4,
    "name": "Dr. Aaron Tan",
    "specialty": "general",
    "role": "Emergency Care",
    "bio": "Nine years in practice, much of it on our walk-in emergency list.",
    "photo": "doctor-general-4.jpg",
    "serviceIds": [
      1
    ]
  },
  {
    "_id": 5,
    "name": "Dr. Jason Koh",
    "specialty": "endodontics",
    "role": "Retreatment",
    "bio": "Fifteen years in specialist practice, taking on cases other clinics could not settle.",
    "photo": "doctor-endodontics-2.jpg",
    "serviceIds": [
      3
    ]
  },
  {
    "_id": 6,
    "name": "Dr. Lim Hui Min",
    "specialty": "endodontics",
    "role": "Root Canal Therapy",
    "bio": "Master's in Endodontics (HKU) and well over two thousand root canal treatments.",
    "photo": "doctor-endodontics-1.jpg",
    "serviceIds": [
      3
    ]
  },
  {
    "_id": 7,
    "name": "Dr. Benjamin Sim",
    "specialty": "endodontics",
    "role": "Microsurgery",
    "bio": "Trained in surgical endodontics in the UK; works under the operating microscope.",
    "photo": "doctor-endodontics-3.jpg",
    "serviceIds": [
      3
    ]
  },
  {
    "_id": 8,
    "name": "Dr. Ryan Chua",
    "specialty": "endodontics",
    "role": "Dental Trauma",
    "bio": "Seven years in hospital practice with knocked-out and fractured teeth.",
    "photo": "doctor-endodontics-4.jpg",
    "serviceIds": [
      3
    ]
  },
  {
    "_id": 9,
    "name": "Dr. Ethan Wong",
    "specialty": "orthodontics",
    "role": "Fixed Braces",
    "bio": "Orthodontic residency in Sydney and fourteen years of complex bite corrections.",
    "photo": "doctor-orthodontics-2.jpg",
    "serviceIds": [
      2
    ]
  },
  {
    "_id": 10,
    "name": "Dr. Samuel Teo",
    "specialty": "orthodontics",
    "role": "Early Treatment",
    "bio": "Focuses on children aged seven to twelve, guiding growth early.",
    "photo": "doctor-orthodontics-3.jpg",
    "serviceIds": [
      2
    ]
  },
  {
    "_id": 11,
    "name": "Dr. Nicholas Yeo",
    "specialty": "orthodontics",
    "role": "Retention",
    "bio": "Ten years in orthodontics, looking after the retention stage.",
    "photo": "doctor-orthodontics-4.jpg",
    "serviceIds": [
      2
    ]
  },
  {
    "_id": 12,
    "name": "Dr. Ng Jia Hui",
    "specialty": "orthodontics",
    "role": "Clear Aligners",
    "bio": "Certified aligner provider since 2015 with more than a thousand cases planned.",
    "photo": "doctor-orthodontics-1.jpg",
    "serviceIds": [
      2
    ]
  },
  {
    "_id": 13,
    "name": "Dr. Chua Mei Xin",
    "specialty": "periodontics",
    "role": "Gum Disease",
    "bio": "Specialist periodontist (King's College London), thirteen years treating gum disease.",
    "photo": "doctor-periodontics-1.jpg",
    "serviceIds": [
      1
    ]
  },
  {
    "_id": 14,
    "name": "Dr. Kelvin Ho",
    "specialty": "periodontics",
    "role": "Gum Grafting",
    "bio": "Eleven years of experience rebuilding receded gum lines.",
    "photo": "doctor-periodontics-2.jpg",
    "serviceIds": [
      4
    ]
  },
  {
    "_id": 15,
    "name": "Dr. Darren Loh",
    "specialty": "periodontics",
    "role": "Implant Maintenance",
    "bio": "Keeps the gum and bone around implants healthy.",
    "photo": "doctor-periodontics-3.jpg",
    "serviceIds": [
      4
    ]
  },
  {
    "_id": 16,
    "name": "Dr. Goh Shu Fen",
    "specialty": "prosthodontics",
    "role": "Crowns & Bridges",
    "bio": "Trained in Japan; sixteen years in full-mouth rehabilitation and shade matching.",
    "photo": "doctor-prosthodontics-1.jpg",
    "serviceIds": [
      5,
      6
    ]
  },
  {
    "_id": 17,
    "name": "Dr. Jonathan Neo",
    "specialty": "prosthodontics",
    "role": "Dental Implants",
    "bio": "Over a decade placing and restoring implants, with advanced bone-grafting training.",
    "photo": "doctor-prosthodontics-2.jpg",
    "serviceIds": [
      4,
      5
    ]
  },
  {
    "_id": 18,
    "name": "Dr. Bryan Seah",
    "specialty": "prosthodontics",
    "role": "Dentures",
    "bio": "Twelve years on removable prosthetics; known for making a difficult denture fit.",
    "photo": "doctor-prosthodontics-3.jpg",
    "serviceIds": [
      5,
      6
    ]
  }
]
