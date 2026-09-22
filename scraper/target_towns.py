# Target towns for the 2026 homestead search (Clark/Cowlitz/Lewis WA + Salem Polk-Marion + Albany Linn-Benton OR).
# HomeHarvest accepts any city string, so coverage needs no Redfin region IDs.

TARGET_TOWNS = [
    # North Clark County, WA
    ("Battle Ground", "WA"),
    ("Brush Prairie", "WA"),
    ("Hockinson", "WA"),
    ("Ridgefield", "WA"),
    ("La Center", "WA"),
    ("Yacolt", "WA"),
    ("Amboy", "WA"),
    ("Vancouver", "WA"),
    # Cowlitz County, WA
    ("Woodland", "WA"),
    ("Kalama", "WA"),
    ("Castle Rock", "WA"),
    ("Longview", "WA"),
    ("Kelso", "WA"),
    ("Toutle", "WA"),
    ("Vader", "WA"),
    ("Ryderwood", "WA"),
    # Lewis County, WA
    ("Centralia", "WA"),
    ("Chehalis", "WA"),
    ("Napavine", "WA"),
    ("Winlock", "WA"),
    ("Toledo", "WA"),
    ("Mossyrock", "WA"),
    ("Onalaska", "WA"),
    ("Vader", "WA"),
    # Salem / Polk-Marion, OR
    ("Salem", "OR"),
    ("Dallas", "OR"),
    ("Monmouth", "OR"),
    ("Independence", "OR"),
    ("Turner", "OR"),
    ("Aumsville", "OR"),
    ("Silverton", "OR"),
    ("Stayton", "OR"),
    ("Sublimity", "OR"),
    ("Jefferson", "OR"),
    # Albany / Corvallis / Linn-Benton, OR
    ("Albany", "OR"),
    ("Lebanon", "OR"),
    ("Philomath", "OR"),
    ("Adair Village", "OR"),
    ("Tangent", "OR"),
    ("Brownsville", "OR"),
    ("Halsey", "OR"),
    ("Harrisburg", "OR"),
    ("Monroe", "OR"),
    ("Scio", "OR"),
    ("Sodaville", "OR"),
    ("Crawfordsville", "OR"),
    ("Corvallis", "OR"),
]

TARGET_COUNTIES = {
    "WA": {"CLARK", "COWLITZ", "LEWIS"},
    "OR": {"MARION", "POLK", "LINN", "BENTON"},
}

# County + nearby fallbacks (matched via city list when county is blank)
TARGET_CITIES = {
    "battle ground", "brush prairie", "hockinson", "ridgefield", "la center",
    "yacolt", "amboy", "vancouver", "woodland", "kalama", "castle rock",
    "longview", "kelso", "toutle", "vader", "ryderwood", "centralia",
    "chehalis", "napavine", "winlock", "toledo", "mossyrock", "onalaska",
    "salem", "dallas", "monmouth", "independence", "turner", "aumsville",
    "silverton", "stayton", "sublimity", "jefferson", "albany", "lebanon",
    "philomath", "adair village", "tangent", "brownsville", "halsey",
    "harrisburg", "monroe", "scio", "sodaville", "crawfordsville", "corvallis",
}