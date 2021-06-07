// **************************
// ***** TX MENU BUTTON *****
// **************************
const TxMenu = document.getElementById("TxMenu"),
      TxButton = document.getElementById("TxButton");
let TxButtonOpened = false; // Closed by default
TxButton.onclick = () => {
    if ( TxButtonOpened ) {
        TxMenu.style["-webkit-transform"] = "translateX(-300px)";
        TxMenu.style["-moz-transform"] = "translateX(-300px)";
        TxMenu.style["-ms-transform"] = "translateX(-300px)";
        TxMenu.style["-o-transform"] = "translateX(-300px)";
        TxMenu.style["transform"] = "translateX(-300px)";
        TxButton.innerHTML = "TX</br><span style='font-size:140%;'>&#x25B7</span>";
        TxButtonOpened = false;
    } else {                
        TxMenu.style["-webkit-transform"] = "translateX(0px)";
        TxMenu.style["-moz-transform"] = "translateX(0px)";
        TxMenu.style["-ms-transform"] = "translateX(0px)";
        TxMenu.style["-o-transform"] = "translateX(0px)";
        TxMenu.style["transform"] = "translateX(0px)";
        TxButton.innerHTML = "TX</br><span style='font-size:140%;'>&#x25C1</span>";
        TxButtonOpened = true;
    }
    TxButton.style.border = "none";
}

TxButton.onmouseover = () => {
    if ( TxButtonOpened ) {
        TxButton.innerHTML = "TX</br><span style='font-size:140%;'>&#x25C0</span>";
    } else {
        TxButton.innerHTML = "TX</br><span style='font-size:140%;'>&#x25B6</span>";
    }
    TxButton.style.border = "2px solid #000000";
}
TxButton.onmouseout = () => {
    if ( TxButtonOpened ) {
        TxButton.innerHTML = "TX</br><span style='font-size:140%;'>&#x25C1</span>";
    } else {
        TxButton.innerHTML = "TX</br><span style='font-size:140%;'>&#x25B7</span>";
    }
    TxButton.style.border = "none";
}

// **************************
// ***** RX MENU BUTTON *****
// **************************
const RxMenu = document.getElementById("RxMenu"),
      RxButton = document.getElementById("RxButton");
let RxButtonOpened = false; // Closed by default
RxButton.onclick = () => {
    if ( RxButtonOpened ) {
        RxMenu.style["-webkit-transform"] = "translateX(300px)";
        RxMenu.style["-moz-transform"] = "translateX(300px)";
        RxMenu.style["-ms-transform"] = "translateX(300px)";
        RxMenu.style["-o-transform"] = "translateX(300px)";
        RxMenu.style["transform"] = "translateX(300px)";
        RxButton.innerHTML = "RX</br><span style='font-size:140%;'>&#x25C1</span>";
        RxButtonOpened = false;
    } else {                
        RxMenu.style["-webkit-transform"] = "translateX(0px)";
        RxMenu.style["-moz-transform"] = "translateX(0px)";
        RxMenu.style["-ms-transform"] = "translateX(0px)";
        RxMenu.style["-o-transform"] = "translateX(0px)";
        RxMenu.style["transform"] = "translateX(0px)";
        RxButton.innerHTML = "RX</br><span style='font-size:140%;'>&#x25B7</span>";
        RxButtonOpened = true;
    }
    RxButton.style.border = "none";
}
RxButton.onmouseover = () => {
    if ( RxButtonOpened ) {
        RxButton.innerHTML = "RX</br><span style='font-size:140%;'>&#x25B6</span>";
    } else {
        RxButton.innerHTML = "RX</br><span style='font-size:140%;'>&#x25C0</span>";
    }
    RxButton.style.border = "2px solid white";
}
RxButton.onmouseout = () => {
    if ( RxButtonOpened ) {
        RxButton.innerHTML = "RX</br><span style='font-size:140%;'>&#x25B7</span>";
    } else {
        RxButton.innerHTML = "RX</br><span style='font-size:140%;'>&#x25C1</span>";
    }
    RxButton.style.border = "none";
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
const TxInfos = document.getElementById("TxInfos"),
      RxInfos = document.getElementById("RxInfos"),
      BSARInfos = document.getElementById("BSARInfos"),
      plotIsoRangeDop = document.getElementById("plotIsoRangeDop"),
      plotGAFAmp = document.getElementById("plotGAFAmp");
let BSARbuttonOpened = false; // Infos not show by default
BSARbutton.onclick = () => {
    if ( BSARbuttonOpened ) {
        TxInfos.style["-webkit-transform"] = RxInfos.style["-webkit-transform"] = BSARInfos.style["-webkit-transform"] = "translateY(-240px)";
        TxInfos.style["-moz-transform"] = RxInfos.style["-moz-transform"] = BSARInfos.style["-moz-transform"] = "translateY(-240px)";
        TxInfos.style["-ms-transform"] = RxInfos.style["-ms-transform"] = BSARInfos.style["-ms-transform"] = "translateY(-240px)";
        TxInfos.style["-o-transform"] = RxInfos.style["-o-transform"] = BSARInfos.style["-o-transform"] = "translateY(-240px)";
        TxInfos.style["transform"] = RxInfos.style["transform"] = BSARInfos.style["transform"] = "translateY(-240px)";
        plotIsoRangeDop.style["-webkit-transform"] = plotGAFAmp.style["-webkit-transform"] = "translateY(400px)";
        plotIsoRangeDop.style["-moz-transform"] = plotGAFAmp.style["-moz-transform"] = "translateY(400px)";
        plotIsoRangeDop.style["-ms-transform"] = plotGAFAmp.style["-ms-transform"] = "translateY(400px)";
        plotIsoRangeDop.style["-o-transform"] = plotGAFAmp.style["-o-transform"] = "translateY(400px)";
        plotIsoRangeDop.style["transform"] = plotGAFAmp.style["transform"] = "translateY(400px)";
        BSARbutton.innerHTML = "Bistatic SAR configurator&ensp;<span style='font-size:140%;'>&#x25BC</span>";
        BSARbuttonOpened = false;
    } else {
        TxInfos.style["-webkit-transform"] = RxInfos.style["-webkit-transform"] = BSARInfos.style["-webkit-transform"] = "translateY(60px)";
        TxInfos.style["-moz-transform"] = RxInfos.style["-moz-transform"] = BSARInfos.style["-moz-transform"] = "translateY(60px)";
        TxInfos.style["-ms-transform"] = RxInfos.style["-ms-transform"] = BSARInfos.style["-ms-transform"] = "translateY(60px)";
        TxInfos.style["-o-transform"] = RxInfos.style["-o-transform"] = BSARInfos.style["-o-transform"] = "translateY(60px)";
        TxInfos.style["transform"] = RxInfos.style["transform"] = BSARInfos.style["transform"] = "translateY(60px)";
        plotIsoRangeDop.style["-webkit-transform"] = plotGAFAmp.style["-webkit-transform"] = "translateY(0px)";
        plotIsoRangeDop.style["-moz-transform"] = plotGAFAmp.style["-moz-transform"] = "translateY(0px)";
        plotIsoRangeDop.style["-ms-transform"] = plotGAFAmp.style["-ms-transform"] = "translateY(0px)";
        plotIsoRangeDop.style["-o-transform"] = plotGAFAmp.style["-o-transform"] = "translateY(0px)";
        plotIsoRangeDop.style["transform"] = plotGAFAmp.style["transform"] = "translateY(0px)";
        BSARbutton.innerHTML = "Bistatic SAR configurator&ensp;<span style='font-size:140%;'>&#x25B2</span>";
        BSARbuttonOpened = true;
    }
}
BSARbutton.onmouseover = () => {
    if ( BSARbuttonOpened ) {
    BSARbutton.innerHTML = "Bistatic SAR configurator&ensp;<span style='font-size:140%;'>&#x25B2</span>";
    } else {
    BSARbutton.innerHTML = "Bistatic SAR configurator&ensp;<span style='font-size:140%;'>&#x25BC</span>";
    }
    BSARbutton.style.border = "2px solid white";
}
BSARbutton.onmouseout = () => {
    if ( BSARbuttonOpened ) {
    BSARbutton.innerHTML = "Bistatic SAR configurator&ensp;<span style='font-size:140%;'>&#x25B3</span>";
    } else {
    BSARbutton.innerHTML = "Bistatic SAR configurator&ensp;<span style='font-size:140%;'>&#x25BD</span>";
    }
    BSARbutton.style.border = "none";
}

// ***** BUTTONS *****
// => see in scene.js
