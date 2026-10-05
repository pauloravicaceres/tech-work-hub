import { VALIDATIONS } from "@data/constants/errors/validations.const";
import { IMAGES_ROUTES } from "@data/constants/routes/images.routes";
import { ENUM_VALIDATION_OPTIONS } from "@data/enum";
import { ILogin } from "@data/interfaces";
import { faFacebookSquare, faInstagramSquare, faTwitterSquare } from "@fortawesome/free-brands-svg-icons";
import { ValidationsService } from "@shared/services/validations.service";

export const LOGIN_PAGE: {
    FORM: ILogin,
    ICONS: any[];
    STYLE_BACKGROUND: any;
    LOGO: string;
} = {
    FORM: {
        user: {
            val: '',
            error: VALIDATIONS.USER_REQUIRED_FIELD,
            isValid() {
                const validationsService = new ValidationsService();
                const validateUser = validationsService.validateField( this.val, ENUM_VALIDATION_OPTIONS.USER );
                this.error = validateUser.msg;
                return validateUser.isValid;
            }
        },
        password: {
            val: '',
            error: VALIDATIONS.PASSWORD_REQUIRED_FIELD,
            isValid() {
                const validationsService = new ValidationsService();
                const validatePassword = validationsService.validateField( this.val, ENUM_VALIDATION_OPTIONS.PASSWORD );
                this.error = validatePassword.msg;
                return validatePassword.isValid;
            }
        }
    },
    ICONS: [
        faFacebookSquare,
        faTwitterSquare,
        faInstagramSquare
    ],
    STYLE_BACKGROUND: {
        backgroundImage: `url(${IMAGES_ROUTES.BACKGROUND_LOGIN})`
    },
    LOGO: IMAGES_ROUTES.LOGO
}
