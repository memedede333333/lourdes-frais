/**
 * Partage des Frais – Lourdes
 * Google Apps Script — VERSION RÉELLEMENT DÉPLOYÉE (récupérée le 10/08/2026).
 *
 * ⚠️ Ce fichier est la SOURCE DE VÉRITÉ. Ne pas le remplacer par une
 * reconstruction. Toute modification doit être redéployée (voir docs/DEPLOIEMENT.md).
 *
 * Feuille utilisée : onglet "Data" uniquement.
 * Colonnes : A Type | B ID | C Nom | D Membres | E Montant | F Description | G Date | H Supprimé
 *
 * Actions supportées : add (défaut), delete, update.
 * Actions NON supportées (voir docs/ETAT-DES-LIEUX.md) : reset_year, clear_all.
 */

function doPost(e) {
 try {
   const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
   let sheet = spreadsheet.getSheetByName('Data');
   
   // Créer l'onglet s'il n'existe pas
   if (!sheet) {
     sheet = spreadsheet.insertSheet('Data');
     sheet.getRange(1, 1, 1, 8).setValues([
       ['Type', 'ID', 'Nom', 'Membres', 'Montant', 'Description', 'Date', 'Supprimé']
     ]);
   }
   
   // Parser les données reçues
   const data = JSON.parse(e.postData.contents);
   
   // Action normale : ajouter une ligne
   if (!data.action || data.action === 'add') {
     if (data.type === 'FAM') {
       // Ajouter une famille
       sheet.appendRow([
         'FAM',
         data.id,
         data.name,
         data.members,
         '', // Pas de montant pour une famille
         '',
         new Date().toLocaleDateString('fr-FR'),
         '' // Pas supprimé
       ]);
     } else if (data.type === 'DEP') {
       // Ajouter une dépense
       sheet.appendRow([
         'DEP',
         data.id,
         data.familyName,
         '', // Pas de membres pour une dépense
         data.amount,
         data.description,
         data.date || new Date().toLocaleDateString('fr-FR'),
         '' // Pas supprimé
       ]);
     }
   }
   
   // Action de suppression : marquer comme supprimé
   else if (data.action === 'delete') {
     const dataRange = sheet.getDataRange();
     const values = dataRange.getValues();
     
     // Trouver la ligne avec l'ID correspondant
     for (let i = 1; i < values.length; i++) {
       if (String(values[i][1]) === String(data.id)) {
         // Marquer comme supprimé (colonne H = 8)
         sheet.getRange(i + 1, 8).setValue(new Date().toLocaleString('fr-FR'));
         break;
       }
     }
   }
   
   // Action de modification
   else if (data.action === 'update') {
     const dataRange = sheet.getDataRange();
     const values = dataRange.getValues();
     
     // Trouver et modifier la ligne
     for (let i = 1; i < values.length; i++) {
       if (String(values[i][1]) === String(data.id)) {
         if (data.type === 'FAM' && data.members !== undefined) {
           // Modifier le nombre de membres (colonne D = 4)
           sheet.getRange(i + 1, 4).setValue(data.members);
         } else if (data.type === 'DEP' && data.amount !== undefined) {
           // Modifier le montant (colonne E = 5)
           sheet.getRange(i + 1, 5).setValue(data.amount);
         }
         break;
       }
     }
   }
   
   return ContentService
     .createTextOutput(JSON.stringify({success: true}))
     .setMimeType(ContentService.MimeType.JSON);
     
 } catch(error) {
   return ContentService
     .createTextOutput(JSON.stringify({error: error.toString()}))
     .setMimeType(ContentService.MimeType.JSON);
 }
}

// Fonction pour nettoyer les données supprimées (optionnel)
function cleanupDeleted() {
 const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data');
 if (!sheet) return;
 
 const data = sheet.getDataRange().getValues();
 
 // Parcourir de bas en haut pour éviter les problèmes d'index
 for (let i = data.length - 1; i >= 1; i--) {
   if (data[i][7] && data[i][7] !== '') { // Si marqué comme supprimé
     sheet.deleteRow(i + 1);
   }
 }
}

// Fonction de test pour vérifier que ça marche
function test() {
 const testData = {
   postData: {
     contents: JSON.stringify({
       type: 'FAM',
       id: Date.now(),
       name: 'Famille Test',
       members: 4
     })
   }
 };
 
 const result = doPost(testData);
 console.log(result.getContent());
}
