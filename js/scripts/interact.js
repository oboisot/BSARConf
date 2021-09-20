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
      BSARbuttonImgLeft = document.getElementById('BSARbuttonImgLeft'),
      BSARbuttonImgRight = document.getElementById('BSARbuttonImgRight'),
      TxInfos = document.getElementById("TxInfos"),
      RxInfos = document.getElementById("RxInfos"),
      BSARInfos = document.getElementById("BSARInfos"),
      plotIsoRangeDop = document.getElementById("plotIsoRangeDop"),
      plotGAFAmp = document.getElementById("plotGAFAmp");
let BSARbuttonOpened = false; // Infos not shown by default
BSARbutton.onclick = () => {
    if ( BSARbuttonOpened ) {        
        BSARbuttonImgRight.style.transform = BSARbuttonImgLeft.style.transform = "rotate(90deg)";
        TxInfos.style.transform = RxInfos.style.transform = BSARInfos.style.transform = "translateY(-300px)";
        plotIsoRangeDop.style.transform = plotGAFAmp.style.transform = "translateY(400px)";
        BSARbuttonOpened = false;
    } else {
        BSARbuttonImgRight.style.transform = "rotate(270deg)";
        BSARbuttonImgLeft.style.transform = "rotate(-90deg)";
        TxInfos.style.transform = RxInfos.style.transform = BSARInfos.style.transform = "translateY(60px)";
        plotIsoRangeDop.style.transform = plotGAFAmp.style.transform = "translateY(0px)";
        BSARbuttonOpened = true;
    }
}
BSARbutton.onmouseover = () => {
    BSARbutton.style.border = "2px solid #ffffff";
    BSARbuttonImgRight.src = BSARbuttonImgLeft.src = "./img/icons/arrow-filled.svg";
}
BSARbutton.onmouseout = () => {
    BSARbutton.style.border = "none";
    BSARbuttonImgRight.src = BSARbuttonImgLeft.src = "./img/icons/arrow-contour.svg";
}
// ***** BUTTONS *****
// => see in scene.js
