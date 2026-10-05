import { Injectable } from '@angular/core';
import { IFieldsExport } from '@data/interfaces/ui/table.interface';
import { Workbook } from 'exceljs';
import  * as fs  from 'file-saver';

const EXCEL_EXTENSION = '.xlsx';
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTR-8';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  public exportAsExcelFile(
    headerExport: IFieldsExport[],
    excelFileName: string,
    sheetName: string,
    data?: any[]
  )
  {
    const header:any[] = [];
    const keysdata: any[] = [];

    headerExport.forEach(element => {
      header.push(element.description),
      keysdata.push(element.codigo)
    });

    const content = data;

    const documento = new Workbook();
    documento.created = new Date();
    documento.modified = new Date();

    const worksheet = documento.addWorksheet(sheetName);

    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell, index) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'BDBDBD'},
        bgColor: { argb: 'BDBDBD'},
      };
      cell.font = { size:12, bold:true, color: { argb: '000000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center'}
      
      // worksheet.getColumn(index).width = header[index - 1].length < 20 ? 20:header[index-1].length;
      worksheet.getColumn(index).width = headerExport[index - 1].ancho;
    });
    worksheet.getRow(1).height = 28;

debugger
    if (content != undefined) {
      content.forEach((element:any) => {
        const eachRow: any[] = [];
        keysdata.forEach((key) => {
          eachRow.push(element[key]);
        });

        if(element.isDeleted === 'Y'){
          const deleteRow = worksheet.addRow(eachRow);
          deleteRow.eachCell((cell) => {
            cell.font = {name: 'Calibri', family: 4, size:20, bold:false, strike:true};
          });
        }else{
          const contentRow = worksheet.addRow(eachRow);
          contentRow.eachCell((cell, index) => {
            cell.alignment = { vertical: 'middle', horizontal: headerExport[index - 1].horizontal};

            let e = eachRow[index - 1];
            const STATUS = headerExport[index - 1].description.toUpperCase();
            if(STATUS == 'ESTADO' || STATUS == 'STATUS') {
              let color_status = 'EF4444'
              if(e == 'APROBADO')
                color_status = '22C55E'
              else if(e == 'PENDIENTE')
                color_status = 'F59E0B'
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: color_status }
              };
              cell.font = { color: { argb: 'FFFFFF' } };
            }

          });
        }

      });
    }

    worksheet.addRow([]);


    documento.xlsx.writeBuffer().then((data: ArrayBuffer) => {
      const blob = new Blob([data], {type: EXCEL_TYPE});
      fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
    })
  }

  

  public export_Base64_To_Blob=(b64Data:any, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

}
