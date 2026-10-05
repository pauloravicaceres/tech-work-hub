import { VALIDATIONS_OPERATIVE_INSTRUCTION } from "@data/constants/errors/validations.operative-instruction.const";
import { IOperativeInstructionDetail } from "@data/interfaces";

export const PRODUCT_PLAN_COBERTURA_PAGE: {
    FORM: IOperativeInstructionDetail
} = {
    FORM: {
        id: 0,
        credit_number: {
            val: '',
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.CREDIT_NUMBER_REQUIRED_FIELD,
            isValid() { return (this.val !== '' && this.val !== null); }
        },
        client: {
            val: '',
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.CLIENT_REQUIRED_FIELD,
            isValid() { return (this.val !== '' && this.val !== null); }
        },
        category: {
            val: '',
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.CATEGORY_REQUIRED_FIELD,
            isValid() { return (this.val !== '' && this.val !== null); }
        },
        product: {
            val: '',
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.PRODUCT_REQUIRED_FIELD,
            isValid() { return (this.val !== '' && this.val !== null); }
        },
        subproduct: {
            val: '',
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.SUBPRODUCT_REQUIRED_FIELD,
            isValid() { return (this.val !== '' && this.val !== null); }
        },
        value_date: {
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.VALUE_DATE_REQUIRED_FIELD,
            isValid() { return (this.val !== undefined && this.val !== null) }
        },
        register_date: {
            error: VALIDATIONS_OPERATIVE_INSTRUCTION.VALUE_REGISTER_REQUIRED_FIELD,
            isValid() { return (this.val !== undefined && this.val !== null) }
        },
    }
}
