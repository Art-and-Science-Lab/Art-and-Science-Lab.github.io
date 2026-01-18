// ---- Quantities ----
const quantities = {
length_m:   { label:"Length",       si:"m",         exp:[ 0, 0, 1, 0] },
time_s:     { label:"Time",         si:"s",         exp:[ 0, 0, 0, 1] },
velocity:  { label:"Velocity",     si:"m/s",       exp:[ 0, 0, 1,-1] },
acceleration: { label:"Acceleration", si:"m/s²", exp:[0,0,1,-2] },
mass_kg:  { label:"Mass",        si:"kg",        exp:[ 1, 0, 0, 0] },
momentum_p: { label:"Momentum", si:"kg·m/s", exp:[1,0,1,-1] },
action_S: { label:"Action", si:"J·s", exp:[1,0,2,-1], hidden:true },
force_N:  { label:"Force",       si:"N",         exp:[ 1, 0, 1,-2] },
energy_J: { label:"Energy",      si:"J",         exp:[ 1, 0, 2,-2] },
power_W:  { label:"Power",       si:"W",         exp:[ 1, 0, 2,-3] },
charge_C: { label:"Charge",      si:"C",         exp:[ 0, 1, 0, 0] },
current_A:{ label:"Current",     si:"A = C/s",   exp:[ 0, 1, 0,-1] },
voltage_V:{ label:"Voltage",     si:"V = J/C",   exp:[ 1,-1, 2,-2] },
resistance_Ohm:{label:"Resistance", si:"Ω = V/A", exp:[ 1,-2, 2,-1] },
capacitance_F:{label:"Capacitance", si:"F = C/V", exp:[-1, 2,-2, 2] },
electricField: { label:"Electric field",  si:"V/m", exp:[ 1,-1, 1,-2] },
magneticField:{ label:"Magnetic field",  si:"T = N/(A·m)", exp:[ 1,-1, 0,-1] },
inverse_length: { label:"Inverse length", si:"1/m", exp:[0,0,-1,0], hidden:true },
vacuumPermeability: {label:"Vacuum permeability (μ₀)",si:"N/A²",exp:[ 1, -2, 1, 0 ], hidden:true},
vacuumPermittivity: {label:"Vacuum permittivity (ε₀)",si:"F/m",exp:[ -1, 2, -3, 2 ], hidden:true},
gravitational_G: {label: "Gravitational constant",si: "m³/(kg·s²)",exp: [-1, 0, 3, -2], hidden:true},
dimensionless: { label:"Dimensionless", si:"1", exp:[0,0,0,0], hidden:true },
custom:   { label:"Custom", si:"kgᵃ·Cᵇ·mᶜ·sᵈ", exp:[0,0,0,0] }
};

// ---- Constants (with sig) ----
const constants = {
    none: { label:"—", quantityKey:"", siValue:"", sig: null },
    c0:   { label:"Speed of light (c)", quantityKey:"velocity", siValue:"299792458", sig: 9 },
    e0:   { label:"Elementary charge (e)", quantityKey:"charge_C",siValue:"1.602176634e-19", sig: 9 },
    h:    { label:"Planck constant (h)", quantityKey:"action_S",siValue:"6.62607015e-34", sig: 9 },
    hbar: { label:"Reduced Planck constant (ħ)", quantityKey:"action_S",siValue:"1.054571817e-34", sig: 9 },
    alpha:{ label:"Fine-structure constant (α)", quantityKey:"dimensionless",siValue:"0.007297352569", sig: 9 },
    alphaInv:{ label:"Inverse fine-structure constant (α⁻¹, α₀)", quantityKey:"dimensionless",siValue:"137.035999084", sig: 9 },
    re: { label:"Classical electron radius (rₑ)", quantityKey:"length_m",siValue:"2.81794033e-15", sig: 9 },
    lambdaC: { label:"Compton wavelength (λ_C)", quantityKey:"length_m",siValue:"2.42631024e-12", sig: 9 },
    lambdaCbar: { label:"Reduced Compton wavelength (λ̄_C)", quantityKey:"length_m",siValue:"3.86159268e-13", sig: 9 },
    rydberg: { label:"Rydberg constant (R∞)", quantityKey:"inverse_length",siValue:"10973731.6", sig: 9 },
    rydbergInv: { label:"Inverse Rydberg constant (R∞⁻¹)", quantityKey:"length_m",siValue:"9.11267051e-8", sig: 9 },
    me: { label:"Electron mass (mₑ)", quantityKey:"mass_kg",siValue:"9.1093837e-31", sig: 9 },
    mp: { label:"Proton mass (mₚ)", quantityKey:"mass_kg",siValue:"1.67262192e-27", sig: 9 },
    mn: { label:"Neutron mass (mₙ)", quantityKey:"mass_kg",siValue:"1.67492750e-27", sig: 9 },
    mEarth: { label:"Earth mass (M⊕)", quantityKey:"mass_kg",siValue:"5.9722e24", sig: 5 },
    mSun: { label:"Solar mass (M☉)", quantityKey:"mass_kg",siValue:"1.98847e30", sig: 6 },
    Z0: { label:"Vacuum impedance (Z₀)", quantityKey:"resistance_Ohm",siValue:"376.730314", sig: 9 },
    mu0: { label:"Vacuum permeability (μ₀)", quantityKey:"vacuumPermeability",siValue:"1.25663706e-6", sig: 9 },
    eps0:{ label:"Vacuum permittivity (ε₀)", quantityKey:"vacuumPermittivity",siValue:"8.85418781e-12", sig: 9 },
    G: { label: "Gravitational constant (G)", quantityKey: "gravitational_G",siValue: "6.67430e-11", sig: 6 },
    delta: {label: "delta",quantityKey: "",siValue: "2.78025226e32",sig: 9,hidden: true},
    gamma: {label: "gamma",quantityKey: "",siValue: "5.27280974e12",sig: 9,hidden: true},
    sigma: {label: "sigma",quantityKey: "",siValue: "3.54869119e14",sig: 9,hidden: true},
    tau: {label: "tau",quantityKey: "",siValue: "1.06387085e23",sig: 9,hidden: true},
};

function siExpToStExp(siExp){
    const [kgExp, cExp, mExp, sExp] = siExp;
    const m2 = mExp + 3*kgExp + 2*cExp;
    const s2 = sExp - 2*kgExp - 1*cExp;
    return [0, 0, m2, s2];
    }

function unitHTMLFromTerms(terms){
    const num = [], den = [];
    const termHTML = (name, pAbs) =>
        (pAbs === 1)
        ? `<span class="pow">${name}</span>`
        : `<span class="pow">${name}<sup>${pAbs}</sup></span>`;
    for (const {name, pow} of terms){
        if (!pow) continue;
        const t = termHTML(name, Math.abs(pow));
        (pow > 0 ? num : den).push(t);
    }
    const joinDot = a => a.join(`<span class="dot">·</span>`);
    const n = num.length ? joinDot(num) : `<span class="pow">1</span>`;
    if (!den.length) return `<span class="u">${n}</span>`;
    return `<span class="u"><span class="frac"><span class="num">${n}</span><span class="bar"></span><span class="den">${joinDot(den)}</span></span></span>`;
    }

function unitHTMLFromExp(exp){
    const names = ["kg","C","m","s"];
    const terms = exp.map((p,i)=>({name:names[i], pow:p})).filter(t=>t.pow!==0);
    return unitHTMLFromTerms(terms);
    }

function unitHTML_STN_fromStExp(stExp){
    const M = stExp[2], S = stExp[3];
    const terms = [];
    if (M) terms.push({name:"L", pow:M});
    if (S) terms.push({name:"T", pow:S});
    return unitHTMLFromTerms(terms);
    }

function fmtSigTrim(x, sig){
    if (!isFinite(x)) return "";
    if (x === 0) return "0";
    if (!sig || sig <= 0) sig = 9;
    let s = Number(x).toPrecision(sig);
    const parts = s.split("e");
    let m = parts[0];
    if (m.includes(".")) {
        m = m.replace(/0+$/, "").replace(/\.$/, "");
    }
    if (m === "-0") m = "0";
    return parts.length === 2 ? `${m}e${parts[1]}` : m;
    }

function scaleFactor_SI_to_ST(siExp){
    const kgExp = siExp[0];
    const cExp  = siExp[1];
    const delta = Number(constants.delta.siValue);
    const gamma = Number(constants.gamma.siValue);
    return Math.pow(delta, kgExp) * Math.pow(gamma, cExp);
    }

function scaleFactor_ST_to_STN(stExp){
    const M = stExp[2];
    const S = stExp[3];
    const sigma = Number(constants.sigma.siValue);
    const tau   = Number(constants.tau.siValue); 
    return Math.pow(sigma, M) * Math.pow(tau, S);
    }

function applySelectedConstant(){
    const ck = cSel.value;
    if (!ck || ck === "none") return;
    const C = constants[ck];
    if (!C) return;
    if (C.quantityKey) {
        qSel.value = C.quantityKey;
        refreshUnits();
    }
    const siExp = getCurrentSiExp();
    if (!siExp) return;
    const sig = C.sig || 9;
    const siV  = Number(C.siValue);
    const stV  = siV * scaleFactor_SI_to_ST(siExp);
    const stExp = siExpToStExp(siExp);   // [0,0,M,S]
    const stnV  = stV * scaleFactor_ST_to_STN(stExp);
    siIn.value  = fmtSigTrim(siV,  sig);
    stIn.value  = fmtSigTrim(stV,  sig);
    stnIn.value = fmtSigTrim(stnV, sig);
    }

// ===============================
// Live recompute (SI / ST / STN)
// ===============================
let _updating = false;
function parseNum(s){
s = (s||"").trim();
if (!s) return null;
if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
return Number(s);
}

function computeTripletFromSI(siV, siExp){
    const stExp = siExpToStExp(siExp);
    const f_si_to_st = scaleFactor_SI_to_ST(siExp);
    const f_st_to_stn = scaleFactor_ST_to_STN(stExp);
    const stV  = siV * f_si_to_st;
    const stnV = stV * f_st_to_stn;
    return { siV, stV, stnV };
    }

function computeTripletFromST(stV, siExp){
    const stExp = siExpToStExp(siExp);
    const f_si_to_st = scaleFactor_SI_to_ST(siExp);
    const f_st_to_stn = scaleFactor_ST_to_STN(stExp);
    const siV  = stV / f_si_to_st;
    const stnV = stV * f_st_to_stn;
    return { siV, stV, stnV };
    }

function computeTripletFromSTN(stnV, siExp){
    const stExp = siExpToStExp(siExp);
    const f_si_to_st = scaleFactor_SI_to_ST(siExp);
    const f_st_to_stn = scaleFactor_ST_to_STN(stExp);
    const stV = stnV / f_st_to_stn;
    const siV = stV / f_si_to_st;
    return { siV, stV, stnV };
    }

function renderTriplet(tri, sig=9){
    siIn.value  = fmtSigTrim(tri.siV,  sig);
    stIn.value  = fmtSigTrim(tri.stV,  sig);
    stnIn.value = fmtSigTrim(tri.stnV, sig);
    }

function renderTripletExcept(tri, except, sig=9){
    if (except !== "si")  siIn.value  = fmtSigTrim(tri.siV,  sig);
    if (except !== "st")  stIn.value  = fmtSigTrim(tri.stV,  sig);
    if (except !== "stn") stnIn.value = fmtSigTrim(tri.stnV, sig);
    }

function recomputeFrom(which, finalize=false){
    if (_updating) return;
    const siExp = getCurrentSiExp();
    if (!siExp) return;
    const sig = 9;
    let v = null;
    if (which === "si")  v = parseNum(siIn.value);
    if (which === "st")  v = parseNum(stIn.value);
    if (which === "stn") v = parseNum(stnIn.value);
    if (v === null) return;
    let tri = null;
    if (which === "si")  tri = computeTripletFromSI(v, siExp);
    if (which === "st")  tri = computeTripletFromST(v, siExp);
    if (which === "stn") tri = computeTripletFromSTN(v, siExp);
    _updating = true;
    try{
        if (!finalize){
        renderTripletExcept(tri, which, sig);
        } else {
        renderTriplet(tri, sig);
        }
    } finally {
        _updating = false;
    }
    }

function wireLiveRecompute(){
    siIn.addEventListener("input",  () => recomputeFrom("si", false));
    stIn.addEventListener("input",  () => recomputeFrom("st", false));
    stnIn.addEventListener("input", () => recomputeFrom("stn", false));
    siIn.addEventListener("change",  () => recomputeFrom("si", true));
    stIn.addEventListener("change",  () => recomputeFrom("st", true));
    stnIn.addEventListener("change", () => recomputeFrom("stn", true));
    }


// ========== DOM & UI ==========
const qSel   = document.getElementById("quantity");
const cSel   = document.getElementById("constant");
const siIn   = document.getElementById("siValue");
const stIn   = document.getElementById("stValue");
const stnIn  = document.getElementById("stnValue");
const siUnit = document.getElementById("siUnit");
const stUnit = document.getElementById("stUnit");
const stnUnit= document.getElementById("stnUnit");
const customBox = document.getElementById("customBox");
const errEl  = document.getElementById("err");

function clearAllValues(){
    cSel.value = "none";
    siIn.value  = "";
    stIn.value  = "";
    stnIn.value = "";
    }

{
const opt = document.createElement("option");
opt.value = "";
opt.textContent = "—";
qSel.appendChild(opt);
}

Object.entries(quantities).forEach(([k,v])=>{
const opt = document.createElement("option");
opt.value = k;
opt.textContent = `${v.label} (${v.si})`;
if (v.hidden) opt.hidden = true;
qSel.appendChild(opt);
});

{
const opt = document.createElement("option");
opt.value = "none";
opt.textContent = "—";
cSel.appendChild(opt);
}

Object.entries(constants).forEach(([k,v])=>{
if(v.hidden) return;
if(k === "none") return;
const opt = document.createElement("option");
opt.value = k;
opt.textContent = v.label;
cSel.appendChild(opt);
});

function parseIntStrict(s){
s=(s||"").trim();
if(!/^[+-]?\d+$/.test(s))return null;
return parseInt(s,10);
}

function getCurrentSiExp(){
const key=qSel.value;
if(!key)return null;
let exp=quantities[key].exp.slice();
if(key==="custom"){
    const a=parseIntStrict(document.getElementById("a").value);
    const b=parseIntStrict(document.getElementById("b").value);
    const c=parseIntStrict(document.getElementById("c").value);
    const d=parseIntStrict(document.getElementById("d").value);
    if([a,b,c,d].some(x=>x===null))return null;
    exp=[a,b,c,d];
}
return exp;
}

function refreshUnits(){
errEl.style.display="none";
if(!qSel.value){
    customBox.style.display="none";
    siUnit.innerHTML="—"; stUnit.innerHTML="—"; stnUnit.innerHTML="—";
    return;
}
const key=qSel.value;
customBox.style.display=(key==="custom")?"block":"none";
const siExp=getCurrentSiExp();
if(!siExp){
    siUnit.innerHTML="—"; stUnit.innerHTML="—"; stnUnit.innerHTML="—";
    return;
}
const stExp=siExpToStExp(siExp);
siUnit.innerHTML=unitHTMLFromExp(siExp);
stUnit.innerHTML=unitHTMLFromExp(stExp);
stnUnit.innerHTML=unitHTML_STN_fromStExp(stExp);
}

qSel.addEventListener("change", () => {refreshUnits();clearAllValues();});
cSel.addEventListener("change", applySelectedConstant);
wireLiveRecompute();

// ========== Init ==========
qSel.value="mass_kg";
refreshUnits();