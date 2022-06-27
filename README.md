# GNSS EXIFR

1. Add (or) Replace GeoTag Information from CSV to JPEG (or) JPG Drone Imageries (embedded into EXIF).
2. Remove GeoTag Information from Drone Imageries completely.
3. Export GeoTag Information from Drone Imageries to CSV. (ImageName, Longitude, Latitude, Altitude)

## Download and Use Tool
https://github.com/gisnode/gnss-exifr/releases/download/portable/gnss-exifr.1.0.0.exe

## Prerequisites for Download - Microsoft Visual C++ Redistributable
https://github.com/gisnode/gnss-exifr/releases/download/prerequisites/VC_redist.x64.exe
#### (Or) Download vc_redist.x64.exe from https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist

## Development Dependencies
```
Core: Exiv2 - Image Metadata Library (https://exiv2.org)
Package: Vue Framework and Electron-Builder
```

### Install Modules for Development
```
yarn install
```

### Compiles and hot-reloads for Development
```
yarn electron:serve
```

### Compiles and minifies for Production
```
yarn buildportable
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
