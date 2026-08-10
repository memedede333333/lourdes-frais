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
       sheet.appendRow([
         'FAM', data.id, data.name, data.members, '', '',
         new Date().toLocaleDateString('fr-FR'), ''
       ]);
     } else if (data.type === 'DEP') {
       sheet.appendRow([
         'DEP', data.id, data.familyName, '', data.amount, data.description,
         data.date || new Date().toLocaleDateString('fr-FR'), ''
       ]);
     } else if (data.type === 'REG') {
       // Règlement : virement marqué comme réglé
       sheet.appendRow([
         'REG', data.id, data.name, '', '', '',
         new Date().toLocaleDateString('fr-FR'), ''
       ]);
     }
   }
   
   // Action de suppression : marquer comme supprimé
   else if (data.action === 'delete') {
     const dataRange = sheet.getDataRange();
     const values = dataRange.getValues();
     const now = new Date().toLocaleString('fr-FR');
     let familyName = data.familyName || null;
     
     for (let i = 1; i < values.length; i++) {
       if (String(values[i][1]) === String(data.id)) {
         sheet.getRange(i + 1, 8).setValue(now);
         if (values[i][0] === 'FAM' && !familyName) {
           familyName = values[i][2];
         }
         break;
       }
     }
     
     // Cascade : marquer toutes les DEP de cette famille comme supprimées
     if (familyName) {
       for (let i = 1; i < values.length; i++) {
         if (values[i][0] === 'DEP'
             && String(values[i][2]) === familyName
             && (!values[i][7] || values[i][7] === '')) {
           sheet.getRange(i + 1, 8).setValue(now);
         }
       }
     }
   }
   
   // Action de modification
   else if (data.action === 'update') {
     const dataRange = sheet.getDataRange();
     const values = dataRange.getValues();
     
     for (let i = 1; i < values.length; i++) {
       if (String(values[i][1]) === String(data.id)) {
         if (data.type === 'FAM' && data.members !== undefined) {
           sheet.getRange(i + 1, 4).setValue(data.members);
         } else if (data.type === 'DEP' && data.amount !== undefined) {
           sheet.getRange(i + 1, 5).setValue(data.amount);
         }
         break;
       }
     }
   }
   
   // Action unsettle : annuler un règlement (marquer les REG correspondants comme supprimés)
   else if (data.action === 'unsettle') {
     const dataRange = sheet.getDataRange();
     const values = dataRange.getValues();
     const now = new Date().toLocaleString('fr-FR');
     
     for (let i = 1; i < values.length; i++) {
       if (values[i][0] === 'REG'
           && String(values[i][2]) === String(data.key)
           && (!values[i][7] || values[i][7] === '')) {
         sheet.getRange(i + 1, 8).setValue(now);
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
 
 for (let i = data.length - 1; i >= 1; i--) {
   if (data[i][7] && data[i][7] !== '') {
     sheet.deleteRow(i + 1);
   }
 }
}

// Fonction de test
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