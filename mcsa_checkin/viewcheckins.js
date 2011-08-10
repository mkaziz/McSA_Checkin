var map;
var markersArray = [];
var currInfowindow = null;


/**
 *  The jQuery function that is run when the document is first
 *  loaded. Should be used to check essentials, such as whether
 *  the user is logged in, etc.
 */
$(document).ready(function() {
	checkLoggedIn();
	getCheckinsList();
	//loadMap();
	//getLocations();
});

/**
 * Makes sure user is logged in. If not, takes them to the 
 * login page.
 */
function checkLoggedIn() {
	if (localStorage["mcsa_checkin_firstname"] == null || localStorage["mcsa_checkin_userid"] == null) {
		alert("You are not logged in");
		window.location = "login.html";
	}
}

/**
 * Logs the user out by removing items from localStorage.
 */
function logOut() {
	
	localStorage.removeItem("mcsa_checkin_userid");
	localStorage.removeItem("mcsa_checkin_firstname");
	//window.location = "login.html";

}

function getCheckinsList() {

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=checkinsList",
                success: function(html){
			if (html == "") 
				alert("return data is null.");
			//alert(html);
			var jsonData = processOutput(html);
			if (jsonData != null)
				displayCheckinText(jsonData);
			}
                });

}

function processOutput(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status != 1) {
		$("body").html("Error loading page. Check your internet connection or contact an administrator.");
		return null;
	}

	return jsonData;

}

function displayCheckinText(jsonData) {

	// clear out map div;
	$("#map").html("");
	$("#switch").html("<div id='switch' style='font-size: 12px;' align='right'><a href='#' onclick='loadMap();'>Switch to Map View</a></div>");

	var checkinArr = jsonData.data;
	var checkinStr = "";

	for (var i = 0; i < checkinArr.length; i++) {

		var tempString = "<p><b>"+checkinArr[i].firstname+"</b> checked in at <b>"+checkinArr[i].location_name+"</b> at <b>"+checkinArr[i].time+"</b> on "+checkinArr[i].date+".</p>";
		checkinStr = checkinStr+tempString;

	}
	
	checkinStr = checkinStr+"<br>";

	$("#checkintxt").html(checkinStr);

}


function getLocations() {

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=mapLocations",
                success: function(html){
			if (html == "") 
				alert("return data is null.");
			//alert(html);
			var jsonData = processOutput(html);
			if (jsonData != null)
				loadMarkers(jsonData);
			}
                });

}

function loadMap() {

	// clear checkin text
	$("#checkintxt").html("");
	$("#switch").html("<div id='switch' style='font-size: 12px;' align='right'><a href='#' onclick='getCheckinsList();'>Switch to List View</a></div>");

	$("#map").html("<div id=\"map_canvas\"></div>");

    var latlng = new google.maps.LatLng(42.05498075047313, -87.67717480659485);
    var myOptions = {
    	  	zoom: 15,
		minZoom: 15,	
		maxZoom: 17,
      		center: latlng,
 		mapTypeId: google.maps.MapTypeId.ROADMAP,
  	    
    	};

    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    
    getLocations();

}

function checkIn(location_id) {

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=checkin&locationsmenu="+location_id+"&user_id="+localStorage["mcsa_checkin_userid"],
                success: function(html){
			if (html == "") 
				alert("return data is null.");
//				alert(html);
				checkInsertSuccess(html);
			}
          });
}

function checkInsertSuccess(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status == 1) {
		window.location = "viewcheckins.html";
	}
	else 
		alert("error in server response: " + html);

}

function loadMarkers(jsonData) {
	
	var locArr = jsonData.data;
	var markersTextArr = [];
	
	for (var i = 0; i < locArr.length; i++) {
	
		var marker;
		var tempString;

		if (locArr[i].hasCheckin) {
			tempString = "<div class='markertxt'> - <b>"+locArr[i].firstname+"</b> checked in at <b>"+locArr[i].time+"</b> on "+locArr[i].date+"</div>";
		}
		else {
			tempString = "<div class='markertxt'>Nobody's checked in at "+locArr[i].location_name+". Are you here? Check in now!</div>";
		}

		if (markersTextArr[locArr[i].location_name] == null) {
			markersTextArr[locArr[i].location_name] = { text: "<div class='markerhead'><b>"+locArr[i].location_name+"</b></div>"+tempString,
															 location: locArr[i]};
		}
		else {
			markersTextArr[locArr[i].location_name].text += tempString;			
		}
		//createWindow(marker,locArr[i]);	
	}
	
	for (var name in markersTextArr) {
		if (markersTextArr[name].location.hasCheckin) {
			markersTextArr[name].text += "<br><table><tr style='width: auto;'>";
			markersTextArr[name].text += "<td><div class='markertxt'>Are you also at "+markersTextArr[name].location.location_name+"?</div></td>";
			markersTextArr[name].text += "<td><input type='submit' id='submit' value='Check In!'></td>";
			markersTextArr[name].text += "</tr><table>";
		}
		else {
			markersTextArr[name].text += "<div style='width: auto; text-align: right'><input type='button' id='submit' value='Check In!' onclick='checkIn("+markersTextArr[name].location.location_id+");'></div>";
		}
		createWindow(markersTextArr[name]);
	}
	
}

function createWindow(markerTextData) {

		var locData = markerTextData.location;
		var locText = markerTextData.text;
		var marker;
		
		if (markerTextData.location.hasCheckin) {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locData["latitude"], locData["longitude"]),
				map: map,
				icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png"
			});
		}
		else {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locData["latitude"], locData["longitude"]),
				map: map,
				icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png"
			});
		}
							
		var infowindow = new google.maps.InfoWindow({
			content: locText,
			maxWidth: 270
		});

		google.maps.event.addListener(marker, 'click', function() {openInfowindow(infowindow, marker)});
		
		markersArray[locData.location_name] = marker;
		markersArray[locData.location_name].infowindow = infowindow;
			
}

function openInfowindow(infowindow, marker) {
	if (currInfowindow != null)
		currInfowindow.close();
				
	infowindow.open(map,marker);
				
	currInfowindow = infowindow;
}
