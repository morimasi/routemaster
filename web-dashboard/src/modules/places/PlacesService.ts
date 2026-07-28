import type { PlaceDetailsRequest } from './types';

export class PlacesService {
  private static autocompleteService: google.maps.places.AutocompleteService | null = null;
  private static placesService: google.maps.places.PlacesService | null = null;
  private static sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

  static init(map: google.maps.Map): void {
    if (!this.autocompleteService) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
    }
    if (!this.placesService) {
      this.placesService = new google.maps.places.PlacesService(map);
    }
    this.sessionToken = new google.maps.places.AutocompleteSessionToken();
  }

  static getSessionToken(): google.maps.places.AutocompleteSessionToken {
    if (!this.sessionToken) {
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();
    }
    return this.sessionToken;
  }

  static newSession(): void {
    this.sessionToken = new google.maps.places.AutocompleteSessionToken();
  }

  static async getPlacePredictions(
    request: Omit<google.maps.places.AutocompleteRequest, 'types' | 'componentRestrictions'>,
    options?: {
      types?: string[];
      componentRestrictions?: google.maps.places.ComponentRestrictions;
    }
  ): Promise<google.maps.places.AutocompletePrediction[]> {
    if (!this.autocompleteService) {
      throw new Error('PlacesService not initialized');
    }

    return new Promise((resolve, reject) => {
      this.autocompleteService!.getPlacePredictions(
        { 
          ...request, 
          sessionToken: this.getSessionToken(),
          types: options?.types,
          componentRestrictions: options?.componentRestrictions,
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Autocomplete error: ${status}`));
          }
        }
      );
    });
  }

  static async getPlaceDetails(
    request: Omit<PlaceDetailsRequest, 'sessionToken'>
  ): Promise<google.maps.places.PlaceResult> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized');
    }

    return new Promise((resolve, reject) => {
      this.placesService!.getDetails(
        { ...request, sessionToken: this.getSessionToken() },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Place details error: ${status}`));
          }
        }
      );
    });
  }

  static async searchNearby(
    request: google.maps.places.PlaceSearchRequest
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized');
    }

    return new Promise((resolve, reject) => {
      this.placesService!.nearbySearch(
        request,
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Nearby search error: ${status}`));
          }
        }
      );
    });
  }

  static async searchText(
    request: google.maps.places.TextSearchRequest
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized');
    }

    return new Promise((resolve, reject) => {
      this.placesService!.textSearch(
        request,
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Text search error: ${status}`));
          }
        }
      );
    });
  }

  static getAutocompleteService(): google.maps.places.AutocompleteService | null {
    return this.autocompleteService;
  }

  static getPlacesService(): google.maps.places.PlacesService | null {
    return this.placesService;
  }
}

export function createAutocomplete(
  input: HTMLInputElement,
  options?: google.maps.places.AutocompleteOptions
): google.maps.places.Autocomplete {
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['establishment', 'geocode'],
    componentRestrictions: { country: 'tr' },
    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating', 'user_ratings_total', 'photos', 'opening_hours'],
    ...options,
  });
  return autocomplete;
}

export function createSearchBox(
  input: HTMLInputElement,
  options?: google.maps.places.SearchBoxOptions
): google.maps.places.SearchBox {
  const searchBox = new google.maps.places.SearchBox(input, {
    bounds: new google.maps.LatLngBounds(
      new google.maps.LatLng(40.8, 28.5),
      new google.maps.LatLng(41.5, 29.5)
    ),
    ...options,
  });
  return searchBox;
}