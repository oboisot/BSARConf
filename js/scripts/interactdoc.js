// ***********************
// ***** BSAR BUTTON *****
// ***********************
const DocButton = document.getElementById('DocButton'),
      presentationHref = document.getElementById('presentationHref');
DocButton.onclick = () => { presentationHref.click(); }

// **********************
// ***** TOC BUTTON *****
// **********************
    // Back to top button
const BackToTop = document.getElementById('BackToTop'),
      BackToTopImg1 = document.getElementById('BackToTopImg1'),
      BackToTopImg2 = document.getElementById('BackToTopImg2');
BackToTop.onclick = () => {
    presentationHref.click();
    BackToTop.style.border = "none";
    BackToTopImg1.src = BackToTopImg2.src = "../img/icons/arrow-contour.svg";
}
BackToTop.onmouseover = () => {
    BackToTop.style.border = "2px solid #ffffff";
    BackToTopImg1.src = BackToTopImg2.src = "../img/icons/arrow-filled.svg";
}
BackToTop.onmouseout = () => {
    BackToTop.style.border = "none";
    BackToTopImg1.src = BackToTopImg2.src = "../img/icons/arrow-contour.svg";
}

    // Table of Contents button
const ToCButton = document.getElementById('ToCButton'),
      ToCButtonImg = document.getElementById('ToCButtonImg'),
      ToC = document.getElementById('ToC'),
      content = document.getElementById('content');
let ToCButtonOpened = false; // Closed by default
ToCButton.onclick = () => {
    if ( ToCButtonOpened ) {
        content.style.paddingRight = "20%";
        ToC.style.transform = "translateX(400px)";
        ToCButtonImg.style.transform = "rotate(180deg)";
        ToCButtonOpened = false;
    } else {
        content.style.paddingRight = "500px";
        ToC.style.transform = "translateX(0px)";
        ToCButtonImg.style.transform = "rotate(0deg)";
        ToCButtonOpened = true;
    }
}
ToCButton.onmouseover = () => {
    ToCButton.style.border = "2px solid #ffffff";
    ToCButtonImg.src = "../img/icons/arrow-filled.svg";
}
ToCButton.onmouseout = () => {
    ToCButton.style.border = "none";
    ToCButtonImg.src = "../img/icons/arrow-contour.svg";
}

    // Adjusting text scroll when opening or closing the TOC
const html = document.getElementsByTagName('html')[0],
      body = document.getElementsByTagName('body')[0];
let percent, transitionFunc;
ToC.ontransitionstart = () => {
    html.style.scrollBehavior = body.style.scrollBehavior = "auto"; // deactivate temporarily the smooth scroll behaviour
    percent = window.scrollY / content.scrollHeight; // get the scroll position relative to the scrollbar height
    transitionFunc = setInterval(
        () => {document.documentElement.scrollTop = Math.round( percent * content.scrollHeight );},
        1
    )
}
ToC.ontransitionend = () => {
    clearInterval( transitionFunc );
    document.documentElement.scrollTop = Math.round( percent * content.scrollHeight );
    html.style.scrollBehavior = body.style.scrollBehavior = "smooth"; // reactivate the smooth scroll behaviour
}
