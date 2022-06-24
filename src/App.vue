.<template>
  <div id="approot">
    <div class="title">GNSS EXIFR</div><br>
    <div class="actions">
      <input type="radio" value="0" v-model="action" >
      <label>Remove</label>

      <input type="radio" value="1" v-model="action" checked>
      <label>Add / Replace</label>

      <input type="radio" value="2" v-model="action" >
      <label>Export</label>
    </div>

    <table style="margin: auto;">
      <tr>
        <td><button class="imgsbtn" v-on:click="selectimagesdir" v-bind:disabled="exifing">Images Folder</button></td>
        <td>
          <span>{{ imagesdirdisplay }}</span><br>
          <span class="infomsg">Images Total: {{ totalimages }}</span>
        </td>
      </tr>
    </table>

    <table style="margin: auto;" v-show="action == '1'">
      <tr>
        <td><button class="csvbtn" v-on:click="selectcsvfile" v-bind:disabled="exifing">CSV File</button></td>
        <td>
          <span>{{ csvpathdisplay }}</span><br>
          <span class="infomsg">GeoInfo: {{ geoinfo }}</span>
        </td>
      </tr>
    </table>

    <table style="margin: auto;" v-show="action == '1' && csvLoaded">
      <tr>
        <td>
          <span>Has Header</span>&emsp;<input type="checkbox" v-model="hasHeader" v-bind:disabled="!csvLoaded">
        </td>
      </tr>
    </table>
    <table style="margin: auto;" v-show="action == '1' && csvLoaded">
      <tr>
        <td>
          <span>Image Name</span>
        </td><td>
          <select v-model="imgnamecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
        <td>
          <span>Longitude</span>
        </td><td>
          <select v-model="longitudecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
      </tr>
      <tr>
        <td>
          <span>Latitude</span>
        </td><td>
          <select v-model="latitudecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
        <td>
          <span>Altitude</span>
        </td><td>
          <select v-model="altitudeecolumn">
            <option disabled value="">Select Column</option>
            <option v-for="(col, index) in columnList" v-bind:key="index">{{ col }}</option>
          </select>
        </td>
      </tr>
    </table>
    <br>
    <div class="infomsg" v-show="action != '2'"> Images Modified: {{ imgmodtry }}</div>
    <div class="actionmsg">{{ statusmsg }}</div>
    <button class="xifbtn" v-on:click="startexifing" v-bind:disabled="exifing">XIF</button>
    <button class="xitbtn" v-on:click="exitnow">Exit</button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch } from 'vue';
import { ref } from '@vue/reactivity';
import './App.scss';

import fs from 'fs';
import path from 'path';

import { ipcRenderer } from 'electron';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

import { execSync, exec } from 'child_process';

export default defineComponent({
  setup() {
    const action = ref('1');

    const imagesdir = ref('');
    const csvpath = ref('');

    const totalimages = ref(0);
    const imgmodtry = ref(0);
    const geoinfo = ref(0);

    const imagesdirdisplay = ref('X://folder');
    const csvpathdisplay = ref('Y://file.csv');

    const defaultMsg = 'Click XIF to Start';
    const statusmsg = ref(defaultMsg);

    const csvLoaded = ref(false);
    const hasHeader = ref(false);

    const imgnamecolumn = ref('');
    const longitudecolumn = ref('');
    const latitudecolumn = ref('');
    const altitudeecolumn = ref('');

    const csvContentParsed = ref();

    const exifing = ref(false);

    const resetColumns = () => {
      imgnamecolumn.value = '';
      longitudecolumn.value = '';
      latitudecolumn.value = '';
      altitudeecolumn.value = '';
    }

    // const columnList = ref(['1', '2', '3', '4']);
    const columnList = computed(() => {
      if (hasHeader.value){
        resetColumns();

        return csvContentParsed.value[0];
      } else {
        setNumericColumns();
        return ['1', '2', '3', '4'];
      }
    });

    const csvParams = {
      hasHeader, csvLoaded,
      imgnamecolumn, longitudecolumn, latitudecolumn, altitudeecolumn, columnList
    };

    const selectimagesdir = () => {
      ipcRenderer.send('open-folder', ['Select Images Folder', 'imagesfolder']);
    }

    const selectcsvfile = () => {
      ipcRenderer.send('open-file', ['Select CSV File', 'csvfile']);
    }

    const showTempMsg = (msg: any, seconds: any) => {
      statusmsg.value = msg;
      setTimeout(() => {
        statusmsg.value = defaultMsg;
      }, seconds * 1000);
    }

    ipcRenderer.on('imagesfolder', (event, arg) => {
      imagesdir.value = arg;

      totalimages.value = fs.readdirSync(arg).filter(img => {
        return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
      }).length;
      
      let foldername = path.basename(arg);
      imagesdirdisplay.value = foldername.length < 10 ? foldername : foldername.substring(0, 10) + '...';
    });

    ipcRenderer.on('csvfile', (event, arg) => {
      if(path.extname(arg) == '.csv'){
        let filename = path.basename(arg, '.csv');
        csvpathdisplay.value = filename.length < 10 ? filename + '.csv' : filename.substring(0, 10) + '.. .csv';

        csvActions(arg);
      } else {
        showTempMsg('Only CSVs', 2);
      }
    });

    const readCSVNLoad = () => {
      const csvContent = fs.readFileSync(csvpath.value, 'utf-8');
      // console.log(csvContent);

      const csvParsed = parse(csvContent, {
        delimiter: ','
      });

      // console.log(csvParsed);
      csvContentParsed.value = csvParsed;
    }

    const setNumericColumns = () => {
      imgnamecolumn.value = '1';
      longitudecolumn.value = '2';
      latitudecolumn.value = '3';
      altitudeecolumn.value = '4';
    }

    watch(() => imgnamecolumn.value, (newval: any, oldval: any) => {
      computeGeoInfo();
      // console.log(newval, oldval);
    });

    const computeGeoInfo = () => {
      geoinfo.value = 0;

      if(imagesdir.value != '' && csvpath.value != ''){
        const files = fs.readdirSync(imagesdir.value);
        const jpgimgs = files.filter(img => {
            return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
        });

        const csvRows = csvContentParsed.value;
        // console.log(csvRows);
        let startIndex = hasHeader.value ? 1 : 0;

        let imgIndex = 0;
        if(hasHeader.value){
          let headerRow = csvRows[0];
          // console.log(headerRow);

          imgIndex = headerRow.findIndex((x: any) => x == imgnamecolumn.value);
        } else {
          imgIndex = parseInt(imgnamecolumn.value) - 1;
        }

        for(let i = startIndex; i < csvRows.length; i++){
          let imagename = csvRows[i][imgIndex];
          if(jpgimgs.includes(imagename)) geoinfo.value = geoinfo.value + 1;
        }
      }
    }

    const csvActions = (arg: any) => {
      csvpath.value = arg;
      csvLoaded.value = true;
      hasHeader.value = false;

      readCSVNLoad();
      setNumericColumns();
      computeGeoInfo();
    }

    const getBinaryPath = () => {
      ipcRenderer.send('binary-path');
    }

    const execPath = ref('');

    ipcRenderer.on('binary-path', (event, arg) => {
      // console.log(arg);
      execPath.value = path.resolve(path.join(arg, './exiv2.exe'));
    });

    onMounted(() => {
      getBinaryPath();
    });

    const degToDmsRational = (degFloat: any) => {
      let secDigits = 5;

      let degAbs = Math.abs(degFloat);
      let minFloat = degAbs % 1 * 60;
      let secFloat = minFloat % 1 * 60;
      let deg = Math.floor(degAbs);
      let min = Math.floor(minFloat);
      let sec = Math.round(secFloat * 10 ** secDigits);

      return `${deg}/1 ${min}/1 ${sec}/${10 ** secDigits}`;
    }

    let mappedObjects: any = {};
    const addGPSExif = () => {
      const csvRows = csvContentParsed.value;
      // console.log(csvRows);
      let startIndex = hasHeader.value ? 1 : 0;

      let imgIndex = 0;
      let lonIndex = 1;
      let latIndex = 2;
      let altIndex = 3;
      if(hasHeader.value){
        let headerRow = csvRows[0];
        // console.log(headerRow);

        imgIndex = headerRow.findIndex((x: any) => x == imgnamecolumn.value);
        lonIndex = headerRow.findIndex((x: any) => x == longitudecolumn.value);
        latIndex = headerRow.findIndex((x: any) => x == latitudecolumn.value);
        altIndex = headerRow.findIndex((x: any) => x == altitudeecolumn.value);
      } else {
        imgIndex = parseInt(imgnamecolumn.value) - 1;
        lonIndex = parseInt(longitudecolumn.value) - 1;
        latIndex = parseInt(latitudecolumn.value) - 1;
        altIndex = parseInt(altitudeecolumn.value) - 1;
      }

      const files = fs.readdirSync(imagesdir.value);
      const jpgimgs = files.filter(img => {
          return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
      });

      let missingImages = [];
      for(let i = startIndex; i < csvRows.length; i++){
        let imagename = csvRows[i][imgIndex];
        let longitude = csvRows[i][lonIndex];
        let latitude = csvRows[i][latIndex];
        let altitude = csvRows[i][altIndex];

        // console.log(imagename, longitude, latitude, altitude);
        let exifArray: any = [];
        exifArray.push('-M"set Exif.GPSInfo.GPSVersionID 2 3 0 0"');
        exifArray.push('-M"set Exif.GPSInfo.GPSLatitudeRef N"');
        exifArray.push(`-M"set Exif.GPSInfo.GPSLatitude ${degToDmsRational(latitude)}"`);
        exifArray.push('-M"set Exif.GPSInfo.GPSLongitudeRef E"');
        exifArray.push(`-M"set Exif.GPSInfo.GPSLongitude ${degToDmsRational(longitude)}"`);
        exifArray.push('-M"set Exif.GPSInfo.GPSAltitudeRef 0"');
        exifArray.push(`-M"set Exif.GPSInfo.GPSAltitude ${Math.round(altitude * 1000)}/1000"`);
        exifArray.push('-M"set Exif.GPSInfo.GPSStatus V"');
        exifArray.push('-M"set Exif.GPSInfo.GPSMapDatum WGS-84"');
        exifArray.push('-M"set Exif.GPSInfo.GPSDifferential 0"');

        // console.log(exifArray);
        mappedObjects[imagename] = exifArray.join(' ');
        // modifyExif(imagename, longitude, latitude, altitude);

        if (!jpgimgs.includes(imagename)) missingImages.push(imagename);
      }

      let missingImagesTxt = missingImages.join('\r\n');
      fs.writeFileSync(path.join(imagesdir.value, '0_MissingImages.txt'), missingImagesTxt);

      let extraImages: any = [];
      let cmdCommandsToExecute = [];
      for (let i = 0; i < jpgimgs.length; i++){
        // console.log(jpgimgs[i]);
        // console.log(mappedObjects[jpgimgs[i]]);

        let exifCLI = mappedObjects[jpgimgs[i]];
        if(exifCLI != undefined){
          let cmd = `"${execPath.value}" ${exifCLI} "${path.join(imagesdir.value, jpgimgs[i])}"`;
          // console.log(cmd);
          cmdCommandsToExecute.push(cmd);
        } else {
          extraImages.push(jpgimgs[i]);
        }
      }

      let extraImagesTxt = extraImages.join('\r\n');
      fs.writeFileSync(path.join(imagesdir.value, '0_ExtraImages.txt'), extraImagesTxt);

      executeCommands(cmdCommandsToExecute);
    }

    const executeCommands = async (cmdCommandsToExecute: any) => {
      for(let i = 0; i < cmdCommandsToExecute.length; i++){
        // console.log(cmdCommandsToExecute[i]);

        await execCLI(cmdCommandsToExecute[i])

        imgmodtry.value = imgmodtry.value + 1;

        let cond1 = action.value == '1' && (i + 1) >= geoinfo.value;
        let cond2 = action.value == '0' && (i + 1) >= totalimages.value;
        if(cond1 || cond2){
          statusmsg.value = 'Completed';
          exifing.value = false;
        }
      }
    }

    const execCLI = (cliCMD: any) => new Promise((resolve) => {
      try {
        exec(cliCMD, () => resolve(0));
      } catch (e) { resolve(1) }
    })

    const removeGPSExif = () => {
      const files = fs.readdirSync(imagesdir.value);
      const jpgimgs = files.filter(img => {
          return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
      });

      let exifArray: any = [];
      exifArray.push('-M"del Exif.GPSInfo.GPSVersionID"');
      exifArray.push('-M"del Exif.GPSInfo.GPSLatitudeRef"');
      exifArray.push('-M"del Exif.GPSInfo.GPSLatitude"');
      exifArray.push('-M"del Exif.GPSInfo.GPSLongitudeRef"');
      exifArray.push('-M"del Exif.GPSInfo.GPSLongitude"');
      exifArray.push('-M"del Exif.GPSInfo.GPSAltitudeRef"');
      exifArray.push('-M"del Exif.GPSInfo.GPSAltitude"');
      exifArray.push('-M"del Exif.GPSInfo.GPSStatus"');
      exifArray.push('-M"del Exif.GPSInfo.GPSMapDatum"');
      exifArray.push('-M"del Exif.GPSInfo.GPSDifferential"');

      // console.log(exifArray);
      let exifCLI = exifArray.join(' ');

      let cmdCommandsToExecute = [];
      for (let i = 0; i < jpgimgs.length; i++){
        let cmd = `"${execPath.value}" ${exifCLI} "${path.join(imagesdir.value, jpgimgs[i])}"`;
        // console.log(cmd);
        cmdCommandsToExecute.push(cmd);
      }

      executeCommands(cmdCommandsToExecute);
    }

    const exportGPSExif = () => {
      const files = fs.readdirSync(imagesdir.value);
      const jpgimgs = files.filter(img => {
          return path.extname(img).toLowerCase() == '.jpg' || path.extname(img).toLowerCase() == '.jpeg'
      });

      let csvContent = [];
      let noGPSInfo = [];
      for (let i = 0; i < jpgimgs.length; i++){
        let cmdLon = `"${execPath.value}" -K Exif.GPSInfo.GPSLongitude -Pv "${path.join(imagesdir.value, jpgimgs[i])}"`;
        let cmdLat = `"${execPath.value}" -K Exif.GPSInfo.GPSLatitude -Pv "${path.join(imagesdir.value, jpgimgs[i])}"`;
        let cmdAlt = `"${execPath.value}" -K Exif.GPSInfo.GPSAltitude -Pv "${path.join(imagesdir.value, jpgimgs[i])}"`;
        // console.log(cmd);
        try {
          const gpsLonParts = execSync(cmdLon).toString().replace(/\s\s+/g, ' ').trim().split(' ');
          let gpsLonD = parseInt(gpsLonParts[0].split('/')[0]) / parseInt(gpsLonParts[0].split('/')[1]);
          let gpsLonM = parseInt(gpsLonParts[1].split('/')[0]) / parseInt(gpsLonParts[1].split('/')[1]);
          let gpsLonS = parseInt(gpsLonParts[2].split('/')[0]) / parseInt(gpsLonParts[2].split('/')[1]);
          let gpsLon = gpsLonD + gpsLonM / 60 + gpsLonS / 3600;
          // console.log(gpsLonParts, gpsLonD, gpsLonM, gpsLonS);

          const gpsLatParts = execSync(cmdLat).toString().replace(/\s\s+/g, ' ').trim().split(' ');
          let gpsLatD = parseInt(gpsLatParts[0].split('/')[0]) / parseInt(gpsLatParts[0].split('/')[1]);
          let gpsLatM = parseInt(gpsLatParts[1].split('/')[0]) / parseInt(gpsLatParts[1].split('/')[1]);
          let gpsLatS = parseInt(gpsLatParts[2].split('/')[0]) / parseInt(gpsLatParts[2].split('/')[1]);
          let gpsLat = gpsLatD + gpsLatM / 60 + gpsLatS / 3600;
          // console.log(gpsLatParts, gpsLatD, gpsLatM, gpsLatS);

          const gpsAltParts = execSync(cmdAlt).toString().trim().split('/');
          let gpsAlt = parseInt(gpsAltParts[0]) / parseInt(gpsAltParts[1]);
          // console.log(gpsAltParts);
          
          // console.log(jpgimgs[i], gpsLon, gpsLat, gpsAlt);

          csvContent.push([
              jpgimgs[i], 
              gpsLon, gpsLat, gpsAlt,
              0, 0, 0,
              0, 0, 0
          ]);

          if(gpsLon == undefined || gpsLat == undefined || gpsAlt == undefined) noGPSInfo.push(jpgimgs[i]);
          
        } catch (e: any) {
          noGPSInfo.push(jpgimgs[i]);
          // console.log(e.toString());
        }
      }

      csvContent.unshift(['image', 'lon', 'lat', 'alt', 'yaw', 'pitch', 'roll', 'omega', 'phi', 'kappa']);
      fs.writeFileSync(path.join(imagesdir.value, '0_GeoInfo.csv'), stringify(csvContent));

      let missedTxt = noGPSInfo.join('\r\n');
      fs.writeFileSync(path.join(imagesdir.value, '0_NotGeotaggedImages.txt'), missedTxt);

      statusmsg.value = 'Completed';
      exifing.value = false;
    }

    const startexifing = () => {
      imgmodtry.value = 0;

      if(imagesdir.value == ''){
        showTempMsg('Select Images Directory', 2);
        return;
      }

      if(imgnamecolumn.value == '' || longitudecolumn.value == '' || latitudecolumn.value == '' || altitudeecolumn.value == ''){
        showTempMsg('Select All Columns', 2);
        return;
      }

      statusmsg.value = 'Started';
      exifing.value = true;

      setTimeout(() => {
        if(action.value == '0'){
          removeGPSExif();
        } else if(action.value == '1'){
          addGPSExif();
        } else if(action.value == '2'){
          exportGPSExif();
        }
      }, 500);
    }

    const exitnow = () => {
      ipcRenderer.send('exit-now');
    }

    return {
      action,
      statusmsg, imagesdirdisplay, csvpathdisplay, totalimages, imgmodtry, geoinfo,
      selectimagesdir, selectcsvfile,
      ...csvParams,
      startexifing, exitnow, exifing
    }

  },
})
</script>
