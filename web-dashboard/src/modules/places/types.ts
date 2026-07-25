export interface AutocompletePrediction extends google.maps.places.AutocompletePrediction {}

export interface PlaceResult extends google.maps.places.PlaceResult {}

export interface PlaceDetailsRequest extends google.maps.places.PlaceDetailsRequest {}

export interface PlaceDetailsResponse extends google.maps.places.PlaceDetailsResponse {}

export interface NearbySearchRequest extends google.maps.places.PlaceSearchRequest {}

export interface TextSearchRequest extends google.maps.places.TextSearchRequest {}

export interface AutocompleteOptions extends google.maps.places.AutocompleteOptions {}

export interface SearchBoxOptions extends google.maps.places.SearchBoxOptions {}

export interface PlaceGeometry {
  location: google.maps.LatLng;
  viewport?: google.maps.LatLngBounds;
}

export interface PlacePhoto {
  getUrl(opts: { maxWidth?: number; maxHeight?: number }): string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface PlaceOpeningHours {
  open_now?: boolean;
  periods?: Array<{
    open: { day: number; time: string };
    close?: { day: number; time: string };
  }>;
  weekday_text?: string[];
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface PlaceResultExtended extends PlaceResult {
  geometry?: PlaceGeometry;
  photos?: PlacePhoto[];
  opening_hours?: PlaceOpeningHours;
  reviews?: PlaceReview[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  website?: string;
  international_phone_number?: string;
  formatted_phone_number?: string;
}

export type PlaceType = 
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'bakery'
  | 'meal_takeaway'
  | 'meal_delivery'
  | 'lodging'
  | 'hotel'
  | 'motel'
  | 'campground'
  | 'parking'
  | 'gas_station'
  | 'electric_vehicle_charging_station'
  | 'hospital'
  | 'pharmacy'
  | 'doctor'
  | 'dentist'
  | 'veterinary_care'
  | 'supermarket'
  | 'convenience_store'
  | 'shopping_mall'
  | 'store'
  | 'bank'
  | 'atm'
  | 'post_office'
  | 'police'
  | 'fire_station'
  | 'bus_station'
  | 'train_station'
  | 'subway_station'
  | 'taxi_stand'
  | 'airport'
  | 'transit_station'
  | 'park'
  | 'tourist_attraction'
  | 'museum'
  | 'zoo'
  | 'aquarium'
  | 'amusement_park'
  | 'stadium'
  | 'gym'
  | 'spa'
  | 'beauty_salon'
  | 'hair_care'
  | 'laundry'
  | 'car_wash'
  | 'car_repair'
  | 'car_rental'
  | 'bicycle_store'
  | 'electronics_store'
  | 'furniture_store'
  | 'hardware_store'
  | 'home_goods_store'
  | 'clothing_store'
  | 'shoe_store'
  | 'jewelry_store'
  | 'book_store'
  | 'department_store'
  | 'florist'
  | 'gift_shop'
  | 'pet_store'
  | 'veterinary_care'
  | 'school'
  | 'university'
  | 'library'
  | 'government_office'
  | 'embassy'
  | 'courthouse'
  | 'city_hall'
  | 'place_of_worship'
  | 'church'
  | 'mosque'
  | 'synagogue'
  | 'cemetery'
  | 'funeral_home';

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  restaurant: 'Restoran',
  cafe: 'Kafe',
  bar: 'Bar',
  bakery: 'Fırın',
  meal_takeaway: 'Paket Servis',
  meal_delivery: 'Yemek Teslimi',
  lodging: 'Konaklama',
  hotel: 'Otel',
  motel: 'Motel',
  campground: 'Kamp Alanı',
  parking: 'Otopark',
  gas_station: 'Benzin İstasyonu',
  electric_vehicle_charging_station: 'EV Şarj İstasyonu',
  hospital: 'Hastane',
  pharmacy: 'Eczane',
  doctor: 'Doktor',
  dentist: 'Diş Hekimi',
  veterinary_care: 'Veteriner',
  supermarket: 'Süpermarket',
  convenience_store: 'Market',
  shopping_mall: 'Alışveriş Merkezi',
  store: 'Mağaza',
  bank: 'Banka',
  atm: 'ATM',
  post_office: 'PTT',
  police: 'Polis',
  fire_station: 'İtfaiye',
  bus_station: 'Otogar',
  train_station: 'Tren İstasyonu',
  subway_station: 'Metro İstasyonu',
  taxi_stand: 'Taksi Durağı',
  airport: 'Havalimanı',
  transit_station: 'Toplu Taşıma',
  park: 'Park',
  tourist_attraction: 'Turistik Yer',
  museum: 'Müze',
  zoo: 'Hayvanat Bahçesi',
  aquarium: 'Akvaryum',
  amusement_park: 'Luna Park',
  stadium: 'Stadyum',
  gym: 'Spor Salonu',
  spa: 'SPA',
  beauty_salon: 'Güzellik Salonu',
  hair_care: 'Kuaför',
  laundry: 'Hırka',
  car_wash: 'Oto Yıkama',
  car_repair: 'Tamirhane',
  car_rental: 'Araç Kiralama',
  bicycle_store: 'Bisiklet Mağazası',
  electronics_store: 'Elektronik Mağazası',
  furniture_store: 'Mobilya Mağazası',
  hardware_store: 'Hırdavat',
  home_goods_store: 'Ev Mağazası',
  clothing_store: 'Giyim Mağazası',
  shoe_store: 'Ayakkabı Mağazası',
  jewelry_store: 'Kuyumcu',
  book_store: 'Kitabevi',
  department_store: 'Büyük Mağaza',
  florist: 'Çiçekçi',
  gift_shop: 'Hediye Mağazası',
  pet_store: 'Pet Shop',
  veterinary_care: 'Veteriner',
  school: 'Okul',
  university: 'Üniversite',
  library: 'Kütüphane',
  government_office: 'Resmi Daire',
  embassy: 'Büyükelçilik',
  courthouse: 'Mahkeme',
  city_hall: 'Belediye',
  place_of_worship: 'İbadethane',
  church: 'Kilise',
  mosque: 'Cami',
  synagogue: 'Sinagog',
  cemetery: 'Mezarlık',
  funeral_home: 'Mezarlık İşletmesi',
};

export const PLACE_TYPES_BY_CATEGORY: Record<string, PlaceType[]> = {
  'Yeme & İçme': ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery'],
  'Konaklama': ['hotel', 'motel', 'campground', 'lodging'],
  'Ulaşım': ['bus_station', 'train_station', 'subway_station', 'taxi_stand', 'airport', 'transit_station'],
  'Araç & Park': ['parking', 'gas_station', 'electric_vehicle_charging_station', 'car_wash', 'car_repair', 'car_rental', 'bicycle_store'],
  'Sağlık': ['hospital', 'pharmacy', 'doctor', 'dentist', 'veterinary_care'],
  'Alışveriş': ['shopping_mall', 'supermarket', 'convenience_store', 'store', 'department_store', 'electronics_store', 'furniture_store', 'home_goods_store', 'clothing_store', 'shoe_store', 'jewelry_store', 'book_store', 'florist', 'gift_shop', 'pet_store', 'hardware_store'],
  'Finans': ['bank', 'atm', 'post_office'],
  'Eğlence & Turizm': ['park', 'tourist_attraction', 'museum', 'zoo', 'aquarium', 'amusement_park', 'stadium'],
  'Spor & Bakım': ['gym', 'spa', 'beauty_salon', 'hair_care', 'laundry'],
  'Eğitim': ['school', 'university', 'library'],
  'Resmi Kurumlar': ['government_office', 'embassy', 'courthouse', 'city_hall', 'police', 'fire_station'],
  'İbadet & Tören': ['place_of_worship', 'church', 'mosque', 'synagogue', 'cemetery', 'funeral_home'],
};