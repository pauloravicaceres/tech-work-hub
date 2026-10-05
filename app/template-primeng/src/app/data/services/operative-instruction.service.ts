import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IApiResponse, IOperativeInstruction, IOperativeInstructionListFilter, IOperativeInstructionValueFilter } from '@data/interfaces';
import { ICategory, IClient, IProduct, ISubproduct } from '@data/interfaces/api/parameter.interface';
import { IFilter } from '@data/interfaces/ui/table.interface';
import { Observable, map } from 'rxjs';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class OperativeInstructionService {

  constructor(private http: HttpClient) { }

  getClients = (): Observable<IClient[]> => {
    return this.http.get<IApiResponse<IClient[]>>('assets/data/client.json')
    .pipe(
      map( response => {
        return response.data;
      } )
    );
  };

  getCategories = (): Observable<ICategory[]> => {
    return this.http.get<IApiResponse<ICategory[]>>('assets/data/category.json')
    .pipe(
      map( response => {
        return response.data;
      } )
    );
  };

  getProducts = (category_id: string): Observable<IProduct[]> => {
    return this.http.get<IApiResponse<IProduct[]>>('assets/data/product.json')
    .pipe(
      map( response => {
        const responseFiltered = response.data.filter((r: any) => r.category_id == category_id)
        return responseFiltered;
      } )
    );
  };

  getSubproducts = (product_id: string): Observable<ISubproduct[]> => {
    return this.http.get<IApiResponse<ISubproduct[]>>('assets/data/subproduct.json')
    .pipe(
      map( response => {
        const responseFiltered = response.data.filter((r: any) => r.product_id == product_id)
        return responseFiltered;
      } )
    );
  };
  
  /**
   * Get list products all
   * @param id number
   */
  getOperativeInstructions(
      data: {
          filter: IFilter;
      }
  ): Observable<IApiResponse<IOperativeInstruction[]>> {
      return this.http.get<IApiResponse<IOperativeInstruction[]>>('assets/data/operative-instruction.json')
      .pipe(
      map( response => {
        const filters = data.filter.filters as IOperativeInstructionValueFilter;
        console.log('getOperativeInstructions::', filters)
        const value_date_start = filters.value_date == null ? '' : filters.value_date[0];
        const value_date_end = (filters.value_date != null && filters.value_date[1] != null) ? filters.value_date[1] : '';
  
        const register_date_start = filters.register_date_start == null ? '' : filters.register_date_start;
        const register_date_end = filters.register_date_end == null ? '' : filters.register_date_end;

        const responseFiltered_1 = response.data.filter( (r: any) => 
        (r.credit_number == filters.credit_number || filters.credit_number == null) && 
        (r.client_code == filters.client?.client_code || filters.client == null) && 
        (r.category_id == filters.category || filters.category == null) && 
        (r.product_id == filters.product || filters.product == null) && 
        (r.subproduct_id == filters.subproduct || filters.subproduct == null) &&
        (r.state_code == filters.status || filters.status == null) &&
        ( (new Date(r.value_date) >= new Date(value_date_start) || value_date_start == '') && (new Date(r.value_date) <= new Date(value_date_end) || value_date_end == '') ) && 
        ( (new Date(r.register_date) >= new Date(register_date_start) || register_date_start == '') && (new Date(r.register_date) <= new Date(register_date_end) || register_date_end == '') )  )

        let row = 1;
        responseFiltered_1.forEach(element => {
          element.row = row;
          element.value_date = moment(element.value_date).format('DD/MM/YYYY');
          element.register_date = moment(element.register_date).format('DD/MM/YYYY');
          row++
        });
        response.totalRecords = responseFiltered_1.length;

        const responseFiltered = responseFiltered_1.filter((r: any) => r.row > data.filter.first! && r.row <= data.filter.first! + data.filter.rows!)
        response.data = responseFiltered;
        
        return response;
      } )
      );
  }



  
  /**
   * Get list products all
   * @param id number
   */
  getOperativeInstructionsAll(
    data: IOperativeInstructionValueFilter
  ): Observable<IApiResponse<IOperativeInstruction[]>> {
    return this.http.get<IApiResponse<IOperativeInstruction[]>>('assets/data/operative-instruction.json')
    .pipe(
    map( response => {
      
      const value_date_start = data.value_date == null ? '' : data.value_date[0];
      const value_date_end = (data.value_date != null && data.value_date[1] != null) ? data.value_date[1] : '';

      const register_date_start = data.register_date_start == null ? '' : data.register_date_start;
      const register_date_end = data.register_date_end == null ? '' : data.register_date_end;

      const responseFiltered_1 = response.data.filter( (r: any) => 
      (r.credit_number == data.credit_number || data.credit_number == null) && 
      (r.client_code == data.client || data.client == null) && 
      (r.category_id == data.category || data.category == null) && 
      (r.product_id == data.product || data.product == null) && 
      (r.subproduct_id == data.subproduct || data.subproduct == null) && 
      (r.state_code == data.status || data.status == null) && 
      ( (new Date(r.value_date) >= new Date(value_date_start) || value_date_start == '') && (new Date(r.value_date) <= new Date(value_date_end) || value_date_end == '') ) && 
      ( (new Date(r.register_date) >= new Date(register_date_start) || register_date_start == '') && (new Date(r.register_date) <= new Date(register_date_end) || register_date_end == '') )  )

      let row = 1;
      responseFiltered_1.forEach(element => {
        element.row = row;
        element.value_date = moment(element.value_date).format('DD/MM/YYYY');
        element.register_date = moment(element.register_date).format('DD/MM/YYYY');
        row++
      });
      response.totalRecords = responseFiltered_1.length;

      return response;
    } )
    );
  }


  
  /**
   * Get list products all
   * @param id number
   */
  getOperativeInstructionsById(
    id: string
  ): Observable<IApiResponse<IOperativeInstruction[]>> {
    return this.http.get<IApiResponse<IOperativeInstruction[]>>('assets/data/operative-instruction.json')
    .pipe(
    map( response => {
      const responseFiltered = response.data.filter( (r: any) => r.credit_number == id )
      response.data = responseFiltered;
      response.totalRecords = 1;
      return response;
    } )
    );
  }
}
