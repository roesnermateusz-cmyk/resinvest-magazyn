<meta name='viewport' content='width=device-width, initial-scale=1'/>// Konfiguracja Google Sheets API
const SHEETS_CONFIG = {
    // INSTRUKCJA KONFIGURACJI:
    // 1. Przejdź do: https://console.cloud.google.com/
    // 2. Utwórz nowy projekt lub wybierz istniejący
    // 3. Włącz Google Sheets API
    // 4. Utwórz klucz API w sekcji "Credentials"
    // 5. Wklej klucz API poniżej
    
    API_KEY: 'AIzaSyCY1aQny5F8RZpH5Gi-KRREWXfAg7aKCuM',
    
    // 6. Utwórz nowy Google Sheets
    // 7. Udostępnij go jako "Anyone with the link can edit"
    // 8. Skopiuj ID arkusza z URL (część między /d/ i /edit)
    // Przykład: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
    // ID to: ABC123XYZ
    
    SPREADSHEET_ID: '1Ez0COS3CAjwfM79EEnpvesH77GyZTJY7XSPC7SYSBCo',
    
    // Nazwy arkuszy w Google Sheets
    SHEETS: {
        DOCUMENTS: 'Dokumenty',
        EMPLOYEES: 'Pracownicy',
        ATTENDANCE: 'Obecnosc'
    }
};

// Funkcja pomocnicza do wykonywania zapytań do Google Sheets API
async function sheetsRequest(method, range, values = null) {
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.SPREADSHEET_ID}`;
    
    if (method === 'GET') {
        const url = `${baseUrl}/values/${range}?key=${SHEETS_CONFIG.API_KEY}`;
        const response = await fetch(url);
        return await response.json();
    } else if (method === 'POST') {
        const url = `${baseUrl}/values/${range}:append?valueInputOption=RAW&key=${SHEETS_CONFIG.API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: values
            })
        });
        return await response.json();
    } else if (method === 'PUT') {
        const url = `${baseUrl}/values/${range}?valueInputOption=RAW&key=${SHEETS_CONFIG.API_KEY}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: values
            })
        });
        return await response.json();
    }
}

// API dla dokumentów
const SheetsAPI = {
    // Pobierz wszystkie dokumenty
    async getDocuments() {
        try {
            const result = await sheetsRequest('GET', `${SHEETS_CONFIG.SHEETS.DOCUMENTS}!A2:K`);
            if (!result.values) return [];
            
            return result.values.map(row => ({
                id: row[0],
                typ: row[1],
                numer: row[2],
                dataWystawienia: row[3],
                dataTransakcji: row[4],
                nrRejestracyjny: row[5],
                oznaczenie: row[6],
                ilosc: row[7],
                kontrahent: row[8],
                podpis: row[9],
                created: row[10]
            }));
        } catch (error) {
            console.error('Błąd pobierania dokumentów:', error);
            return [];
        }
    },
    
    // Dodaj nowy dokument
    async addDocument(doc) {
        try {
            const values = [[
                doc.id,
                doc.typ,
                doc.numer,
                doc.dataWystawienia,
                doc.dataTransakcji,
                doc.nrRejestracyjny,
                doc.oznaczenie,
                doc.ilosc,
                doc.kontrahent,
                doc.podpis,
                doc.created
            ]];
            
            await sheetsRequest('POST', `${SHEETS_CONFIG.SHEETS.DOCUMENTS}!A:K`, values);
            return true;
        } catch (error) {
            console.error('Błąd dodawania dokumentu:', error);
            return false;
        }
    },
    
    // Pobierz pracowników
    async getEmployees() {
        try {
            const result = await sheetsRequest('GET', `${SHEETS_CONFIG.SHEETS.EMPLOYEES}!A2:B`);
            if (!result.values) return [];
            
            return result.values.map(row => ({
                id: parseInt(row[0]),
                name: row[1]
            }));
        } catch (error) {
            console.error('Błąd pobierania pracowników:', error);
            return [];
        }
    },
    
    // Dodaj pracownika
    async addEmployee(emp) {
        try {
            const values = [[emp.id, emp.name]];
            await sheetsRequest('POST', `${SHEETS_CONFIG.SHEETS.EMPLOYEES}!A:B`, values);
            return true;
        } catch (error) {
            console.error('Błąd dodawania pracownika:', error);
            return false;
        }
    },
    
    // Pobierz obecności
    async getAttendance() {
        try {
            const result = await sheetsRequest('GET', `${SHEETS_CONFIG.SHEETS.ATTENDANCE}!A2:D`);
            if (!result.values) return {};
            
            const attendance = {};
            result.values.forEach(row => {
                const key = row[0];
                attendance[key] = {
                    hours: row[1] || '',
                    signature: row[2] || ''
                };
            });
            return attendance;
        } catch (error) {
            console.error('Błąd pobierania obecności:', error);
            return {};
        }
    },
    
    // Zapisz obecność
    async updateAttendance(key, hours, signature) {
        try {
            // Najpierw sprawdź czy wpis już istnieje
            const result = await sheetsRequest('GET', `${SHEETS_CONFIG.SHEETS.ATTENDANCE}!A:A`);
            let rowIndex = -1;
            
            if (result.values) {
                rowIndex = result.values.findIndex(row => row[0] === key);
            }
            
            if (rowIndex >= 0) {
                // Aktualizuj istniejący wiersz (rowIndex + 1 bo pierwsza to nagłówek)
                const range = `${SHEETS_CONFIG.SHEETS.ATTENDANCE}!A${rowIndex + 1}:C${rowIndex + 1}`;
                await sheetsRequest('PUT', range, [[key, hours, signature]]);
            } else {
                // Dodaj nowy wiersz
                const values = [[key, hours, signature]];
                await sheetsRequest('POST', `${SHEETS_CONFIG.SHEETS.ATTENDANCE}!A:C`, values);
            }
            return true;
        } catch (error) {
            console.error('Błąd aktualizacji obecności:', error);
            return false;
        }
    },
    
    // Pobierz liczniki
    async getCounters() {
        try {
            const result = await sheetsRequest('GET', 'Liczniki!A2:B2');
            if (!result.values || !result.values[0]) {
                return { pzCounter: 1, wzCounter: 1 };
            }
            return {
                pzCounter: parseInt(result.values[0][0]) || 1,
                wzCounter: parseInt(result.values[0][1]) || 1
            };
        } catch (error) {
            console.error('Błąd pobierania liczników:', error);
            return { pzCounter: 1, wzCounter: 1 };
        }
    },
    
    // Zapisz liczniki
    async updateCounters(pzCounter, wzCounter) {
        try {
            await sheetsRequest('PUT', 'Liczniki!A2:B2', [[pzCounter, wzCounter]]);
            return true;
        } catch (error) {
            console.error('Błąd aktualizacji liczników:', error);
            return false;
        }
    }
};