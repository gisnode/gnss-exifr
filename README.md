# GNSS EXIFR

1. Add (or) Replace GeoTag Information from CSV to JPEG (or) JPG Drone Imageries (embedded into EXIF).
2. Remove GeoTag Information from Drone Imageries completely.
3. Export GeoTag Information from Drone Imageries to CSV. (ImageName, Longitude, Latitude, Altitude)

Download From
https://github.com/gisnode/gnss-exifr/releases/download/add-replace-remove/exifr.1.0.0.exe

## Development uses:
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
