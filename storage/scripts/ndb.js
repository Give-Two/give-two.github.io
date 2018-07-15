var jsonData;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function loadNativeInfo() {
    if (jsonData !== undefined) return;

    const file = new XMLHttpRequest();

    file.overrideMimeType("application/json");
    file.open("GET", "https://raw.githubusercontent.com/Give-Two/give-two.github.io/master/storage/scripts/natives.json", true);
    file.onreadystatechange = function () {
        if (file.readyState === 4 && file.status === 200) {
            jsonData = JSON.parse(file.responseText);
        }
    };

    file.send(null);
}

// [============= Namespace Functions =============]
function getNamespaces() {
    let i = 0, v = [];

    for (let ns in jsonData) {
        v[i++] = ns;
    }

    return v;
}

function getNamespaceObjectFromName(namespace) {
    return jsonData[namespace.toUpperCase()];
}

function getNamespaceObjects() {
    let i = 0, v = [];

    for (let ns in jsonData) {
        v[i++] = getNamespaceObjectFromName(ns);
    }

    return v;
}

function getNativeCount(namespace) {
    let i = 0;

    for (let n in getNativeObjects(namespace)) {
        i++;
    }

    return i;
}

function getNativeObjects(namespace) {
    const nsObj = getNamespaceObjectFromName(namespace);
    let i = 0, v = [];

    for (let n in nsObj) {
        v[i++] = nsObj[n];
    }

    return v;
}

function isNamespaceTabOpened(namespace) {
    return document.getElementById("na-" + namespace.toUpperCase()) !== null;
}

// [============= Native Functions =============]

function hasComment(native) {
    return native["comment"] !== "";
}

function isNameKnown(native) {
    return !native["name"].startsWith("_0x");
}

function getNameFromHash(hash) {
    const nsObjs = getNamespaceObjects();
    let i = 0;

    for (let ns in jsonData) {
        for (let native in jsonData[ns]) {
            if (native === hash) {
                return jsonData[ns][native].name;
            }
        }
    }
}

function closeNamespaceTab(namespace) {
    const ele = document.getElementById("ns-" + namespace).parentElement;
    const c = ele.innerHTML.split("<ul")[0];
    ele.innerHTML = c;
    document.getElementById("ns-" + namespace).addEventListener("click", function () {
        openNamespaceTab(namespace);
    })
}

async function openNamespaceTab(namespace) {
    const ele = document.getElementById("ns-" + namespace);
    const natives = getNativeObjects(namespace);

    let htmlCode = ele.parentElement.innerHTML + "<ul id='na-" + namespace + "' class='natives'>";

    let i = 0;

    for (let n in jsonData[namespace]) {
        const native = natives[i++];

        const name = native.name;
        const comment = native.comment;
        const jHash = native.jhash;
        const params = native.params;
        const returnType = native.return_type;
        const returnSize = native.return_size;
        const build = native.first_build;

        htmlCode += "<li><a class='nativeName' id='func-" + n + "'>" + " 	•  " +
            "<span class='datatype'>" + returnType + " </span>" +
            name + "(";

        for (let para = 0; para < params.length; para++) {
            const parameter = params[para];

            const type = parameter.type;
            const name = parameter.name;

            htmlCode += "<span class='datatype'>" + type + "  </span>" +
                "<span class='parameterName'>" + name + (para !== params.length - 1 ? ", " : "") + "</span>";
        }

        htmlCode += ")  ";
        htmlCode += "<span class='hash'>//  " + n + (jHash !== undefined ? "  " + jHash : "") + " b" + build + "</span>";
    }

    htmlCode += "</ul>";

    ele.parentElement.innerHTML = htmlCode;

    for (let n in jsonData[namespace]) {
        const funcElement = document.getElementById("func-" + n);

        funcElement.addEventListener("click", function () {
            openFunctionInformation(namespace, n, document.getElementById("func-" + n).innerHTML.substring(3));
        });
    }

    document.getElementById("ns-" + namespace).addEventListener("click", function () {
        closeNamespaceTab(namespace);
    });
}

function openFunctionInformation(namespace, functionHash, functionDeclHTML) {
    const name = getNameFromHash(functionHash);
    const ele = document.getElementById("func-" + functionHash).parentElement;
    const nativeObj = jsonData[namespace][functionHash];

    let newHTML = "<div style='padding-left: 1%;'><div class='funcbox'>" +
        "<p style='font-weight: bold; font-size: 20px;'>" + namespace + "::" + name + "</p><hr>" +
        functionDeclHTML + "<hr>";

    newHTML += "<p style='white-space: pre-wrap; display: inline;'><br>";

    if (hasComment(nativeObj)) {
        newHTML += nativeObj.comment;
    } else newHTML += "No comment available";

    newHTML += "<br><br></p><div id='cpn-" + name + "' class='buttonbox' style='margin-right: 9%;'>Copy Name</div><div id='cph-" + name + "' class='buttonbox'>Copy Hash</div></div></div>";

    ele.innerHTML += newHTML;

    document.getElementById("func-" + functionHash).addEventListener("click", function() {
        closeFunctionInformation(ele, namespace, functionHash, functionDeclHTML);
    });

    document.getElementById("cpn-" + name).addEventListener("click", function () {
        copyTextToClipboard(name);
    });

    document.getElementById("cph-" + name).addEventListener("click", function () {
        copyTextToClipboard(functionHash);
    });

}

function closeFunctionInformation(funcElement, namespace, funcHash, funcDeclHTML) {
    funcElement.innerHTML = funcElement.innerHTML.split("<div")[0];

    document.getElementById("func-" + funcHash).addEventListener("click", function () {
        openFunctionInformation(namespace, funcHash, funcDeclHTML);
    })
}

function copyTextToClipboard(text) {
    const textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;

    document.body.appendChild(textArea);

    textArea.select();


    document.execCommand('copy');

    document.body.removeChild(textArea);
}

// [============= Native Downloading =============]
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

const endl = "\r\n";
function generateNativesFile()
{
    let resultString = "";

    let date = new Date();
    resultString += "#pragma once" + endl + endl
        + "// Generated " + date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear() + endl + endl;


    for (let namespace in jsonData) {
        resultString += "namespace " + namespace + endl +
            "{" + endl;

        let nsObj = jsonData[namespace];
        for (let native in nsObj) {
            let nativeObj = nsObj[native];
            resultString += "\tstatic " + nativeObj.return_type + " " + nativeObj.name + "(";


            let paramsObj = nativeObj["params"];
            for (let param in paramsObj) {
                let paramObj = paramsObj[param];

                resultString += paramObj.type + " " + paramObj.name + (param != paramsObj.length - 1 ? ", " : "");
            }

            if (nativeObj.return_type == "void") {
                resultString += ") { invoke<Void>(";
            }
            else {
                resultString += ") { return invoke<" + nativeObj.return_type + ">(";
            }

            resultString += native + (paramsObj.length != 0 ? ", " : "");

            for (let param in paramsObj) {
                let paramObj = paramsObj[param];

                resultString += paramObj.name + (param != paramsObj.length - 1 ? ", " : "");
            }

            resultString += "); } // " + native + " " + (nativeObj.jhash != null ? nativeObj.jhash : "") + endl;
        }

        resultString += "}" + endl + endl;
    }

    download("natives.h", resultString);
}

async function init() {
    loadNativeInfo();

    while (jsonData === undefined) {
        await sleep(1);
    }

    let namespaces = "";
    let nsCount = 0, nCount = 0, cCount = 0, kCount = 0;
    const v = getNamespaces();

    for (let i = 0; i < v.length; i++) {
        const nC = getNativeCount(v[i]);
        const nObjs = getNativeObjects(v[i]);

        for (let j = 0; j < nObjs.length; j++) {
            if (hasComment(nObjs[j])) {
                cCount++;
            }
            if (isNameKnown(nObjs[j])) {
                kCount++;
            }
        }

        nCount += nC;
        nsCount++;
        namespaces += "<li><a class='namespace' id='ns-" + v[i] + "'>" + v[i] + " [" + nC + "]</a></li>\n";
    }

    document.getElementById("nname").innerHTML = namespaces;

    for (let i = 0; i < v.length; i++) {
        document.getElementById("ns-" + v[i]).addEventListener("click", function () {
            openNamespaceTab(v[i]);
        })
    }

    const infobox = document.getElementById("infobox");
    infobox.innerHTML = "<a class='nohover' style='float: left'>Namespaces: " + nsCount + " | " + "Natives: " + nCount + " | " + "Comments: " + cCount + " | " + "Known names: " + kCount + " | " + "</a>" +
                        "&nbsp;<a onclick='generateNativesFile()'>Generate Natives.h</a>" + infobox.innerHTML;

    document.getElementById("expand").addEventListener("click", function () {
        const c = getNamespaces();

        for (let ns in c) {
            let name = c[ns];

            if (!isNamespaceTabOpened(name)) {
                openNamespaceTab(name);
            }
        }
    });

    document.getElementById("collapse").addEventListener("click", function () {
        const c = getNamespaces();

        for (let ns in c) {
            let name = c[ns];

            if (isNamespaceTabOpened(name)) {
                closeNamespaceTab(name);
            }
        }
    });

    document.getElementById("loading").innerHTML = "";

}
