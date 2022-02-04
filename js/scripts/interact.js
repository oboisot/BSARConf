// **************************
// ***** TX MENU BUTTON *****
// **************************
const TxMenu = document.getElementById("TxMenu"),
      TxButton = document.getElementById("TxButton"),
      TxButtonImg = document.getElementById('TxButtonImg');
let TxButtonOpened = false; // Closed by default
TxButton.onclick = () => {
    TxButton.style.border = "none";
    TxButtonImg.src = "./img/icons/arrow-contour.svg";
    if ( TxButtonOpened ) {
        TxMenu.style.transform = "translateX(-300px)";
        TxButtonImg.style.transform = "rotate(0deg)";
        TxButtonOpened = false;
    } else {
        TxMenu.style.transform = "translateX(0px)";
        TxButtonImg.style.transform = "rotate(180deg)";
        TxButtonOpened = true;
    }
}
TxButton.onmouseover = () => {
    TxButton.style.border = "2px solid #000000";
    TxButtonImg.src = "./img/icons/arrow-filled.svg";
}
TxButton.onmouseout = () => {
    TxButton.style.border = "none";
    TxButtonImg.src = "./img/icons/arrow-contour.svg";
}

// **************************
// ***** RX MENU BUTTON *****
// **************************
const RxMenu = document.getElementById('RxMenu'),
      RxButton = document.getElementById('RxButton'),
      RxButtonImg = document.getElementById('RxButtonImg');
let RxButtonOpened = false; // Closed by default,
RxButton.onclick = () => {
    RxButton.style.border = "none";
    RxButtonImg.src = "./img/icons/arrow-contour.svg";
    if ( RxButtonOpened ) {
        RxMenu.style.transform = "translateX(300px)";
        RxButtonImg.style.transform = "rotate(180deg)";
        RxButtonOpened = false;
    } else {                
        RxMenu.style.transform = "translateX(0px)";
        RxButtonImg.style.transform = "rotate(0deg)";
        RxButtonOpened = true;
    }
}
RxButton.onmouseover = () => {
    RxButton.style.border = "2px solid #ffffff";
    RxButtonImg.src = "./img/icons/arrow-filled.svg";
}
RxButton.onmouseout = () => {
    RxButton.style.border = "none";
    RxButtonImg.src = "./img/icons/arrow-contour.svg";
}

// ******************************
// ***** TX/RX INPUT TABLES *****
// ******************************
function toggleTableInput(id) {
    const el = document.getElementById(id);
    if (el.style.display === "none" || el.style.display === "") {
        el.style.display = "table";
    } else {
        el.style.display = "none";
    }
}

// *****************************
// ***** BSAR MENU BUTTONS *****
// *****************************
const BSARbutton = document.getElementById('BSARbutton'),
      BSARbuttonImg = document.getElementById('BSARbuttonImg'),
      TxInfos = document.getElementById("TxInfos"),
      RxInfos = document.getElementById("RxInfos"),
      BSARInfos = document.getElementById("BSARInfos"),
      plotIsoRangeDop = document.getElementById("plotIsoRangeDop"),
      plotGAFAmp = document.getElementById("plotGAFAmp");
let BSARbuttonOpened = false; // Infos not shown by default
BSARbutton.onclick = () => {
    if ( BSARbuttonOpened ) {        
        BSARbuttonImg.style.transform = "rotate(90deg)";
        TxInfos.style.transform = RxInfos.style.transform = BSARInfos.style.transform = "translateY(-360px)";
        plotIsoRangeDop.style.transform = plotGAFAmp.style.transform = "translateY(400px)";
        BSARbuttonOpened = false;
    } else {
        BSARbuttonImg.style.transform = "rotate(270deg)";
        TxInfos.style.transform = RxInfos.style.transform = BSARInfos.style.transform = "translateY(60px)";
        plotIsoRangeDop.style.transform = plotGAFAmp.style.transform = "translateY(0px)";
        BSARbuttonOpened = true;
    }
}
BSARbutton.onmouseover = () => {
    BSARbutton.style.border = "2px solid #ffffff";
    BSARbuttonImg.src = "./img/icons/arrow-filled.svg";
}
BSARbutton.onmouseout = () => {
    BSARbutton.style.border = "none";
    BSARbuttonImg.src = "./img/icons/arrow-contour.svg";
}

// ******************************
// ***** COORDINATES BUTTON *****
// ******************************
const Coordinates = document.getElementById('Coordinates'),
      coordinatesButton = document.getElementById('coordinatesButton'),
      coordinatesButtonImg = document.getElementById('coordinatesButtonImg');
let coordinatesButtonOpened = false; // Infos not shown by default
coordinatesButton.onclick = () => {
    coordinatesButton.style.border = "none";
    coordinatesButtonImg.src = "./img/icons/arrow-contour.svg";
    if ( coordinatesButtonOpened ) {
        coordinatesButtonImg.style.transform = "rotate(270deg)";
        Coordinates.style.transform = "translateY(390px)";
        coordinatesButtonOpened = false;
    } else {
        coordinatesButtonImg.style.transform = "rotate(90deg)";
        Coordinates.style.transform = "translateY(0px)";
        coordinatesButtonOpened = true;
    }
}
coordinatesButton.onmouseover = () => {
    coordinatesButton.style.border = "2px solid #ffffff";
    coordinatesButtonImg.src = "./img/icons/arrow-filled.svg";
}
coordinatesButton.onmouseout = () => {
    coordinatesButton.style.border = "none";
    coordinatesButtonImg.src = "./img/icons/arrow-contour.svg";
}

// ***** BUTTONS *****
// => see in scene.js
