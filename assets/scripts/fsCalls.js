let userOnlineStatus;


let fs = {
     db = firebase.firestore();
     trackingStarted:false,
               
     newUser: async (theName, theId, thisObj) =>{
          db = firebase.firestore();        
          potentialNew = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", theId).get();
          if(potentialNew.size > 0){
               $("#tboxUserName").val("");
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("The User ID you have entered already exsits");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
               return;
          }       
          thisObj.name= theName,
          thisObj.userName= theId,
          thisObj.wins= 0,
          thisObj.loses= 0,
          thisObj.status= 2
          db.collection("users").doc(theId).set({
               name: thisObj.name,
               wins: thisObj.wins,
               loses: thisObj.loses,
               status: thisObj.status
          })
          .then(function(docRef){
               console.log(docRef.id);
          })
          .catch(function(error) {
               console.error("Error adding document: ", error);
          })         
          gameControls.showMainStage(thisObj);
     },
     getUserId: async (userId, thisObj) => { 
          db = firebase.firestore();         
          curPlayer = await db.collection("users").where(firebase.firestore.FieldPath.documentId(), "==", userId).get();
          if(curPlayer.size == 1 && curPlayer.docs[0].data().status != 1){
               thisObj.status = 1;
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Someone is logged in under that name.");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
          }else if(curPlayer.size == 1 && (curPlayer.docs[0].data().status == 1)){
               thisObj.status = 2;                
               let  theStatus = db.collection('users').doc(curPlayer.docs[0].id);
               theStatus.set({
                   status: 2
               }, { merge: true });
               thisObj.dbID = curPlayer.docs[0].id;
               thisObj.userName = curPlayer.docs[0].id;
               thisObj.name = curPlayer.docs[0].data().name;
               gameControls.showMainStage(curPlayer.docs[0].data());
               /*
               userOnlineStatus = firebase.database().ref(`users/${thisObj.userName}/connection`);
               userOnlineStatus.onDisconnect().set(false);
               userOnlineStatus.on("value").then(function(arg){
                    if(!arg){
                         theStatus.set({
                              status: 1,
                              duelId:""
                              }, { merge: true })
                         }
                    }
               );
               */
               

          }else if(curPlayer.size == 0){
               $("#mainModal .modal-title").text(`Login Issue`);          
               $("#mainModal .modal-body").text("Username does not exist");
               $("#mainModal .modal-footer").css("display","none");
               $("#mainModal").modal();
          }
     },
     syncPlayers: () =>{          
          db = firebase.firestore();
          let curPlayers = db.collection("users").where("status", ">", 1);
          curPlayers.get();
          curPlayers.onSnapshot(function(snapshot){
               snapshot.docChanges().forEach(function (change) {
                    let aPlayer = {
                         name: change.doc.data().name,
                         userName: change.doc.id,
                         wins: change.doc.data().wins,
                         loses: change.doc.data().loses,
                         status: change.doc.data().status,
                         duelId: change.doc.data().duelId
                    };
                    if (change.type === "added") {
                         if(change.doc.data().name != undefined){
                              aPlayer.duelId="";
                              gameControls.addPlayer(aPlayer);                                  
                         }                         
                    }
                    if (change.type === "modified") {
                         gameControls.updatePlayer(aPlayer);                        
                         if(aPlayer.status ==3 && mainUser.userName == aPlayer.userName){
                              mainUser = aPlayer;                              
                              gameControls.showChallenge();
                         }
                         firebase.database().ref(`users/${aPlayer.userName}/connection`).set(true);
                    }
                    if (change.type === "removed") {
                         aPlayer.duelId="";
                         theStatus = db.collection('users').doc(curPlayer.docs[0].id).set({duelId:""}, { merge: true })
                         firebase.database().ref(`users/${aPlayer.userName}/connection`).set(false);
                         gameControls.removePlayer(aPlayer);
                    }
               });
          })
     }, 
     logOut: async (userName, thisObj) => {
          db = firebase.firestore();          
          thisObj.status = 1; 
          let  theStatus = await db.collection('users').doc(userName);
          let  setWithMerge = theStatus.set({
               status: 1
          }, { merge: true });          
          gameControls.hideMainStage();
     },
     issueChallenge: async (challenger, opponent) => {
          db = firebase.firestore();
          myOpp = allPlayers.find(o => o.userName === opponent);
          myOpp.status = 3;
          challenger.status=4;       
          
          db.collection("challenges").add({
               opp1: mainUser.userName,
               opp2: myOpp.userName
          })
          .then(function(docRef){
               console.log(docRef.id);
               myOpp.duelId = docRef.id;
               mainUser.duelId = docRef.id;
               db.collection('users').doc(challenger.userName).set({
                    status: 4,
                    duelId:docRef.id
               }, { merge: true })
               .then(
                    db.collection('users').doc(opponent).set({
                         status: 3,
                         duelId:docRef.id
                    }, { merge: true })
               )
               .catch(function(error) {
                    console.error("Error adding challenger status: ", error);
               });
               
               
          })
          .catch(function(error) {
               console.error("Error adding challenge: ", error);
          })         
     },
     rejectChallenge: async () => {
          db = firebase.firestore();
          db.collection('users').doc(myOpp.userName).set({
               status: 2,
               duelId:""
          }, { merge: true })
          .then(
               db.collection('users').doc(mainUser.userName).set({
                    status: 2,
                    duelId:""
               }, { merge: true }),
               $("#mainModal").modal("hide")
          )
          .catch(function(error) {
               console.error("Error adding challenger status: ", error);
          });
     }
}

