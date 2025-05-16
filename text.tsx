import React, { useEffect, useLayoutEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { KeyWithAnyModel, StoreModel } from "../../../utils/model/common-model";
import {
  fieldError,
  fieldIdAppend,
  getUrl,
  isFieldUpdate,
  isFieldValueUpdate,
} from "../../../utils/common/change.utils";
import "./text.scss";
import validateService from "../../../services/validation-service";
import errorMsg from "../../../assets/_json/error.json";
import { stagesAction } from "../../../utils/store/stages-slice";
import Cards from "../cards/cards";
import { aliasAction } from "../../../utils/store/alias-slice";
import { fieldErrorAction } from "../../../utils/store/field-error-slice";
import { lastAction } from "../../../utils/store/last-accessed-slice";
import { authenticateType } from "../../../utils/common/change.utils";
import { store } from "../../../utils/store/store";
// import ReferralCode from "../../../shared/components/referral-code/referral-code";
// import { referralcodeAction } from "../../../utils/store/referral-code-slice";
 
const Text = (props: KeyWithAnyModel) => {
  const [error, setError] = useState("");
  const stageSelector = useSelector((state: StoreModel) => state.stages.stages);
  const specialCharRegex = /^[^a-zA-Z0-9]+$/;
 
  const userInputSelector = useSelector(
    (state: StoreModel) => state.stages.userInput
  );
  console.log(userInputSelector.applicants)
  const applicantsSelector = useSelector(
    (state: StoreModel) => state.stages.userInput.applicants
  );
  const fieldErrorSelector = useSelector(
    (state: StoreModel) => state.fielderror.error
  );
  const postalCodeSelector = useSelector(
    (state: StoreModel) => state.postalCode.postalCode
  );
  // const referralcodeSelector = useSelector((state: StoreModel) => state.referralcode);
  const resumeSelector = useSelector(
    (state: StoreModel) => state.urlParam.resume
  );

  const updatedStageInputsSelector = useSelector(
    (state: StoreModel) => state.stages.updatedStageInputs
  );
  const dispatch = useDispatch();
 
  const [defaultValue, setDefaultValue] = useState("");
  const [embossCounter, setEmbossCounter] = useState(0);
  const [postalCode, setPostalCode] = useState<any>({});
  const [hide,show] = useState(true);
  // const [showReferralCode, setShowReferralcode] = useState(false);
  const stage = store.getState();
  const [regexPattern, setRegexPattern] = useState('');
 
  const validationPatterns = () => {
    let pattern;
    let fieldName = props.data.logical_field_name;
    if(fieldName === "name_of_business"){
      pattern = "^[a-zA-Z0-9]+$";
    }
    return pattern
  }
  function validateNRIC(nric: string) {

    if (!/^[STFG]\d{7}[A-Z]$/.test(nric)) {
  
      return false;
  
    }
   
    const prefix = nric[0];
  
    const digits = nric.slice(1, 8).split("").map(Number);
  
    const checksumLetter = nric[8];
   
    // Multipliers for checksum calculation
  
    const weights = [2, 7, 6, 5, 4, 3, 2];
  
    const checksumBase = digits.reduce((sum, digit, index) => sum + digit * weights[index], 0);
   
    // Add offset based on prefix
  
    const offset = prefix === "T" || prefix === "G" ? 4 : 0;
  
    const total = checksumBase + offset;
   
    // Compute remainder
  
    const remainder = total % 11;
   
    // Checksum letters for different prefixes
  
    const checksumLetters: { [key: string]: string } = {
      S: "JZIHGFEDCBA",
      T: "JZIHGFEDCBA",
      F: "XWUTRQPNMLK",
      G: "XWUTRQPNMLK"
    };

    // Validate checksum letter
    return checksumLetter === checksumLetters[prefix][remainder];
  
  }
   
  const changeHandler = (
    fieldName: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    embossedNameCounter(event.target.value);
    setDefaultValue(event.target.value);
    props.handleCallback(props.data, event.target.value);
    setError("");
    // if (props.data.logical_field_name === "referral_id_2") {
    //   setDefaultValue(
    //     event.target.value !== ""
    //       ? event.target.value.toUpperCase()
    //       : event.target.value
    //   );
    //   // dispatch(
    //   //   referralcodeAction.setReferralId(
    //   //     event.target.value !== ""
    //   //       ? event.target.value.toUpperCase()
    //   //       : event.target.value
    //   //   )
    //   // );
    //   // dispatch(referralcodeAction.setReferralErrorMsg(""));
    // }
    if (
      (props.data.mandatory === "Yes" ||
        props.data.mandatory === "Conditional") &&
      event.target.value.length < 1 &&
      props.data.logical_field_name !== "referral_id_2"
      &&props.data.logical_field_name !=="tax_id_no_1"&&
      props.data.logical_field_name !=="tax_id_no_2"&&
      props.data.logical_field_name !=="tax_id_no_3"&&
      props.data.logical_field_name !=="tax_id_no_4"

    ) {
      setError(`${errorMsg.emity} ${props.data.rwb_label_name}`);
    } else if (
      `${event.target.value}`[0] === " " ||
      `${event.target.value}`[`${event.target.value}`.length - 1] === " "
    ) {
      setError(
        `${props.data.rwb_label_name} cannot have leading or trailing spaces`
      );
    }else if (
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.logical_field_name == "embossed_name"
    ) {
      setError(`${props.data.rwb_label_name} ${errorMsg.containtext}`);
 
    } else if(
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.rwb_label_name ==="Alias (s) 1"
    ){
        setError(`${props.data.rwb_label_name}${errorMsg.alias}`)
    }
    else if(
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.rwb_label_name ==="Alias (s) 2"
    ){
        setError(`${props.data.rwb_label_name}${errorMsg.alias}`)
    }
    else if(
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.rwb_label_name ==="Alias (s) 3"
    ){
        setError(`${props.data.rwb_label_name}${errorMsg.alias}`)
    }
    else if(
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.rwb_label_name ==="Alias (s) 4"
    ){
        setError(`${props.data.rwb_label_name}${errorMsg.alias}`)
    } else if (
      props.data.regex &&
      !`${event.target.value}`.match(regexPattern) &&
      props.data.logical_field_name !== "referral_id_2" &&
      props.data.logical_field_name !== "full_name" &&props.data.logical_field_name !== "NRIC" &&props.data.logical_field_name !== "passport_no"
      &&props.data.rwb_label_name !=="Alias (s) 1"&&props.data.rwb_label_name !=="Alias (s) 2"&&props.data.rwb_label_name !=="Alias (s) 3"&&props.data.rwb_label_name !=="Alias (s) 4"
) {
  if(props.data.logical_field_name === "name_of_employer_other" || props.data.logical_field_name === "name_of_business"){
    setError(`${props.data.rwb_label_name} ${errorMsg.nameAN}`);
  }
  else if(props.data.logical_field_name !=="tax_id_no_1"&&
  props.data.logical_field_name !=="tax_id_no_2"&&
  props.data.logical_field_name !=="tax_id_no_3"&&
  props.data.logical_field_name !=="tax_id_no_4"){
    setError(`${errorMsg.patterns}${props.data.rwb_label_name} `);
  }

 
    }
    else if (
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.logical_field_name !== "referral_id_2" && props.data.logical_field_name !== "name_of_business" &&
      props.data.logical_field_name == "full_name"
 
    ) {
      setError(`${errorMsg.fullName} `);
     
    }
    else if (
      props.data.regex &&
      event.target.value.length>0 &&
      props.data.logical_field_name == "NRIC"
     
    ) {
     const errorMsg= validateNRIC(event.target.value)?'':'Please Enter Valid NRIC'
      setError(errorMsg);
    }
    else if (
      props.data.regex &&
      !`${event.target.value}`.match(props.data.regex) &&
      props.data.logical_field_name == "passport_no"
     
    ) {
    setError(`${errorMsg.passportAn}`);
    }
   
   // Check for pattern match
 
   
   else if (
      props.data.min_length &&
      `${event.target.value}`.length < props.data.min_length &&
      props.data.logical_field_name !== "referral_id_2"
    ) {
      setError(`${errorMsg.minLength} ${props.data.min_length} characters`);
    }
 
    else if(props.data.logical_field_name === "full_name" &&(event.target.value.match(/@/g)||[]).length>1){
       setError(`${errorMsg.fullNameRegexLimit}`)
    }
   
    else if(props.data.logical_field_name === "name_of_business" && event.target.value.length>1){
   
      setError("");
    }
    else if(props.data.logical_field_name === "crs_comments" && event.target.value.length>0){
        dispatch(fieldErrorAction.getMandatoryFields([]));
        let valObj:any={
          casa_fatca_declaration_a_1: '',
          country_of_tax_residence_a_1: '',
          crs_reason_code_a_1: ''
        }
        for(let key in valObj) {
          if(applicantsSelector[key]!==""&&applicantsSelector[key]!==undefined){
               valObj[key] = applicantsSelector[key];
          }else{
            delete valObj[key];
          }
      }
      valObj={...valObj,
        crs_comments_a_1: event.target.value,
      }
        dispatch(
          stagesAction.removeAddToggleField({
            removeFields: ["tax_id_no","name_of_employer", "nature_of_employer", "job_title","office_phone_number","name_of_business","NRIC"],
            newFields: ["casa_fatca_declaration","country_of_tax_residence","crs_reason_code","crs_comments","per_block","per_street_name","alt_block_1","alt_street_name_1","alt_block_2","alt_street_name_2","alt_block_3","alt_street_name_3","alt_block_4","alt_street_name_4","alt_block_5","alt_street_name_5"],
            value:valObj
          })
        );
    }
    else {
      setError(
        !event.target.validity.valid &&
        props.data.logical_field_name !== "referral_id_2"
          ? `${errorMsg.patterns} ${props.data.rwb_label_name}`
          : ""
      );
    }
    // if (
    //   props.data.logical_field_name === "referral_id_2" &&
    //   referralcodeSelector &&
    //   referralcodeSelector.errormsg !== ""
    // ) {
    //   setError("");
    // }
  };
 
  useEffect(() => {
    setPostalCode(postalCodeSelector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCodeSelector]);
 
  useEffect(() => {
    let setPostalValue = null;
    if (
      props.data.logical_field_name === "block" ||
      props.data.logical_field_name === "building_name" ||
      props.data.logical_field_name === "street_name"
    ) {
      if (props.data.logical_field_name === "block") {
        setPostalValue = postalCode.block_a_1 || "";
      } else if (props.data.logical_field_name === "building_name") {
        setPostalValue = postalCode.building_name_a_1 || "";
      } else if (props.data.logical_field_name === "street_name") {
        setPostalValue = postalCode.street_name_a_1 || "";
      }
      if (setPostalValue) {
        setDefaultValue(setPostalValue);
        props.handleCallback(props.data, setPostalValue);
        dispatch(isFieldValueUpdate(props, stageSelector, setPostalValue));
        dispatch(
          isFieldUpdate(props, setPostalValue, props.data.logical_field_name)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);
 
  useEffect(() => {
    if(props.data.regex === "null" || null){
      if(props.data.logical_field_name === "name_of_business"){
        setRegexPattern("^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$");
      }
    }else {
      setRegexPattern(props.data.regex);
    }
    // if (props.data.logical_field_name === "referral_id_2") {
    //   if ( referralcodeSelector && referralcodeSelector.refer && referralcodeSelector.refer === "true") {
    //     setShowReferralcode(true);
    //     if (referralcodeSelector.referId !== null) {
    //       const getReferralCode =
    //       referralcodeSelector && referralcodeSelector.referId
    //         ? referralcodeSelector.referId.toUpperCase()
    //         : '';
    //     setDefaultValue(getReferralCode);
    //     dispatch(referralcodeAction.setReferralId(getReferralCode));
    //     }
    //     else{
    //        setDefaultValue("");
    //     }
    //   }
    //   if (
    //     getUrl.getParameterByName("auth") === "resume" || resumeSelector
    //   ) {
    //     setShowReferralcode(true);
    //     if(referralcodeSelector && referralcodeSelector.referId){
    //       setDefaultValue(referralcodeSelector && referralcodeSelector.referId);
    //     }
    //   }
    // }
    if(props.data.regex === "null" || null){
      if(props.data.logical_field_name === "name_of_business"){
        setRegexPattern("^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$");
      }
    }else {
      setRegexPattern(props.data.regex);
    }
    if (
      stageSelector &&
      stageSelector[0] &&
      stageSelector[0].stageInfo &&
      stageSelector[0].stageInfo.applicants
    ) {
      const userInputResponse =
        userInputSelector.applicants[fieldIdAppend(props)];
 
      const stageIndex = getUrl
        .getUpdatedStage()
        .updatedStageInputs.findIndex(
          (ref: any) => ref && ref.stageId === stageSelector[0].stageId
        );
      let updatedVal = null;
      if (stageIndex > -1) {
        updatedVal =
          getUrl.getUpdatedStage().updatedStageInputs[stageIndex].applicants[
            fieldIdAppend(props)
          ];
      }
 
      let fieldValue = "";
      if (updatedVal) {
        fieldValue = updatedVal;
      } else if (userInputResponse) {
        fieldValue = userInputResponse;
      } else if (
        stageSelector[0].stageInfo.applicants[fieldIdAppend(props)] &&
        updatedVal !== ""
      ) {
        fieldValue =
          stageSelector[0].stageInfo.applicants[fieldIdAppend(props)];
      }
      if(props.data.logical_field_name === "city_rwb" && authenticateType() === 'manual'){
        setDefaultValue("Singapore");
      }
   if (props.data.logical_field_name === "residential_address_rwb_1") {
        let myInfoAddress :string = "";
        if ((getUrl.getParameterByName("isMyInfoVirtual") === "true") || (authenticateType() === 'manual' && (getUrl.getJourneyType() === 'ETC' || getUrl.getJourneyType() === 'NTC' ))) {
          const block = stageSelector[0].stageInfo.applicants["block_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_line1_a_1"];
          const building = stageSelector[0].stageInfo.applicants["building_name_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_line2_a_1"];
          const street = stageSelector[0].stageInfo.applicants["street_name_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_line3_a_1"];
          const unitNo = stageSelector[0].stageInfo.applicants["unit_no_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_line4_a_1"];
          const postalCode = stageSelector[0].stageInfo.applicants["postal_code_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_postal_code_a_1"];
          const country = (stageSelector[0].stageInfo.applicants["country_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_country_a_1"]) === 'SG' ? 'Singapore' : (stageSelector[0].stageInfo.applicants["country_rwb_a_1"] || stageSelector[0].stageInfo.applicants["res_existing_country_a_1"]);

            if (block || building || street || unitNo || postalCode || country) {
              myInfoAddress = [
                block,
                building,
                street,
                unitNo,
                postalCode,
                country
              ]
                .filter(Boolean)
                .join(",");
            }

        }
        if(myInfoAddress){
        setDefaultValue(myInfoAddress);
        dispatch(
          isFieldUpdate(props, myInfoAddress, props.data.logical_field_name)
          );
        }
      }else if (props.data.logical_field_name === "permanent_address_rwb_1") {
        let myInfoPrAddress :string = "";
        if ((getUrl.getParameterByName("isMyInfoVirtual") === "true") || (authenticateType() === 'manual' && (getUrl.getJourneyType() === 'ETC' || getUrl.getJourneyType() === 'NTC'))) {
        const block = stageSelector[0].stageInfo.applicants["per_existing_line1_a_1"];
        const building =
          stageSelector[0].stageInfo.applicants["per_existing_line2_a_1"];
        const street = stageSelector[0].stageInfo.applicants["per_existing_line3_a_1"];
        const unitNo = stageSelector[0].stageInfo.applicants["per_existing_line4_a_1"];
        const city = stageSelector[0].stageInfo.applicants["per_existing_city_a_1"];
        const state = stageSelector[0].stageInfo.applicants["per_existing_state_a_1"];
        const postalCode =
          stageSelector[0].stageInfo.applicants["per_existing_postal_code_a_1"];
        const country =
        stageSelector[0].stageInfo.applicants["per_existing_country_a_1"] === 'SG'?'Singapore':stageSelector[0].stageInfo.applicants["per_existing_country_a_1"];
        // if (block && street && country) {
          myInfoPrAddress = [
            block,
            building,
            street,
            unitNo,
            city,
            state,
            postalCode,
            country
          ]
            .filter(value => value) // Exclude null or empty values
            .join(",");
        // }
      }
        if(myInfoPrAddress){
        setDefaultValue(myInfoPrAddress);
        dispatch(
          isFieldUpdate(props, myInfoPrAddress, props.data.logical_field_name)
          );
        }
      } else if (
        props.data.logical_field_name === "tax_id_no" &&
        stageSelector[0].stageInfo.applicants["casa_fatca_declaration_a_1"] ===
          "Y"
      ) {
        setDefaultValue(stageSelector[0].stageInfo.applicants["NRIC_a_1"]);
        dispatch(
          isFieldUpdate(
            props,
            stageSelector[0].stageInfo.applicants["NRIC_a_1"],
            props.data.logical_field_name
          )
        );
      }else if(props.data.logical_field_name === "tax_id_no" &&
      stageSelector[0].stageInfo.applicants["tax_id_no_a_1"] !== ""){
        setDefaultValue(stageSelector[0].stageInfo.applicants["tax_id_no_a_1"]);
        dispatch(
          isFieldUpdate(props,stageSelector[0].stageInfo.applicants["tax_id_no_a_1"], props.data.logical_field_name)
          );
      } else if (
        ((props.data.logical_field_name === "embossed_dc_name" &&
          !stageSelector[0].stageInfo.applicants["embossed_dc_name_a_1"]) ||
          (props.data.logical_field_name === "embossed_name" &&
            !stageSelector[0].stageInfo.applicants["embossed_name_a_1"]) ||
          (props.data.logical_field_name === "embossed_name_2" &&
            !stageSelector[0].stageInfo.applicants["embossed_name_2_a_1"])) &&
        new RegExp(props.data.regex).test(
          stageSelector[0].stageInfo.applicants["full_name_a_1"]
        )
      ) {
        const fullName =
          fieldValue || stageSelector[0].stageInfo.applicants["full_name_a_1"];
        if (fullName && fullName.length >= 19) {
          let firstName = fullName.split(" ")[0];
          firstName = firstName.length >= 19 ? "" : firstName;
          embossedNameCounter(firstName);
          setDefaultValue(firstName);
          dispatch(
            isFieldUpdate(props, firstName, props.data.logical_field_name)
          );
          props.handleCallback(props.data, firstName);
        } else {
          embossedNameCounter(fullName);
          setDefaultValue(fullName);
          dispatch(
            isFieldUpdate(props, fullName, props.data.logical_field_name)
          );
          props.handleCallback(props.data, fullName);
        }
      } else if (
        userInputSelector.applicants[props.data.logical_field_name + "_a_1"] !==
          undefined &&
        props.data.logical_field_name.substring(0, 9) === "tax_id_no"
      ) {
        setDefaultValue(fieldValue);
        dispatch(
          isFieldUpdate(
            props,
            fieldValue ||
              userInputSelector.applicants[
                props.data.logical_field_name + "_a_1"
              ],
            props.data.logical_field_name
          )
        );
        props.handleCallback(
          props.data,
          userInputSelector.applicants[props.data.logical_field_name + "_a_1"]
        );
      } else if (
        (stageSelector[0].stageInfo.applicants[
          props.data.logical_field_name + "_a_1"
        ] ||
        fieldValue)
      ) {
        setDefaultValue(fieldValue);
        if (
          !(stageSelector[0].stageId === "ssf-2" && getUrl.getJourneyType())
        ) {
          dispatch(
            isFieldUpdate(props, fieldValue, props.data.logical_field_name)
          );
          props.handleCallback(props.data, fieldValue);
        } else {
          dispatch(
            isFieldUpdate(
              props,
              fieldValue ||
                stageSelector[0].stageInfo.applicants[
                  props.data.logical_field_name + "_a_1"
                ],
              props.data.logical_field_name
            )
          );
          props.handleCallback(
            props.data,
            fieldValue ||
              stageSelector[0].stageInfo.applicants[
                props.data.logical_field_name + "_a_1"
              ]
          );
        }
        if (
          props.data.logical_field_name === "embossed_dc_name" ||
          props.data.logical_field_name === "embossed_name" ||
          props.data.logical_field_name === "embossed_name_2"
        ) {
          embossedNameCounter(
            stageSelector[0].stageInfo.applicants[
              props.data.logical_field_name + "_a_1"
            ]
          );
        }
      } else if (props.data.logical_field_name === "passport_no") {
        const passVal =
          userInputSelector.applicants[
            props.data.logical_field_name + "_a_1"
          ] || "";
        setDefaultValue(passVal);
        dispatch(isFieldUpdate(props, passVal, props.data.logical_field_name));
        props.handleCallback(props.data, passVal);
      } else {
        if(props.data.logical_field_name !== "referral_id_2"&&(props.data.logical_field_name !=="city_rwb" && authenticateType() === 'manual')){
          setDefaultValue(fieldValue);  
        }  
        if (
          !(stageSelector[0].stageId === "ssf-2" && getUrl.getJourneyType())
        ) {
          dispatch(
            isFieldUpdate(props, fieldValue, props.data.logical_field_name)
          );
          props.handleCallback(props.data, fieldValue);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  // useEffect(() => {
  //   if (
  //     props.data.logical_field_name === "tax_id_no" &&
  //     stageSelector &&
  //     stageSelector[0] &&
  //     stageSelector[0].stageInfo &&
  //     stageSelector[0].stageInfo.applicants
  //   ) {
  //     setError("");
  //     const stageIndex = getUrl
  //       .getUpdatedStage()
  //       .updatedStageInputs.findIndex(
  //         (ref: any) => ref && ref.stageId === stageSelector[0].stageId
  //       );
  //     let updatedVal = null;
  //     if (stageIndex > -1) {
  //       updatedVal =
  //         getUrl.getUpdatedStage().updatedStageInputs[stageIndex].applicants[
  //           fieldIdAppend(props)
  //         ];
  //     }
  //     let tax_id_value =
  //       updatedVal ||
  //       stageSelector[0].stageInfo.applicants[
  //         `${props.data.logical_field_name}_a_1`
  //       ];
  //     if (userInputSelector.applicants["casa_fatca_declaration_a_1"] === "Y") {
  //       tax_id_value = stageSelector[0].stageInfo.applicants["NRIC_a_1"];
  //     }
  //     setDefaultValue(tax_id_value ? tax_id_value : "");
  //     dispatch(
  //       isFieldUpdate(props, tax_id_value, props.data.logical_field_name)
  //     );
  //     props.handleCallback(props.data, tax_id_value);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [userInputSelector.applicants.casa_fatca_declaration_a_1]);
 
  useEffect(() => {
    if (props.data.logical_field_name === "annual_income") {
      setDefaultValue(userInputSelector.applicants.annual_income_a_1);}
    //  else if (props.data.logical_field_name === "required_loan_amount") {
    //   setDefaultValue(userInputSelector.applicants.required_loan_amount_a_1);
    // } else if (props.data.logical_field_name === "loan_tenor") {
    //   setDefaultValue(userInputSelector.applicants.loan_tenor_a_1);
    // }
 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userInputSelector.applicants.annual_income_a_1,
    // userInputSelector.applicants.required_loan_amount_a_1,
    // userInputSelector.applicants.loan_tenor_a_1,
  ]);
 
  const bindHandler = (
    fieldName: string,
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    if (event.target.validity.valid && fieldName !== "name_of_employer") {
      const fieldValue = event.target.value;
      props.handleCallback(props.data, event.target.value);
      dispatch(isFieldValueUpdate(props, stageSelector, fieldValue));
      dispatch(isFieldUpdate(props, fieldValue, fieldName));
      if (fieldName === "tax_id_no") {
        dispatch(stagesAction.updateTaxToggle());
      }
      if (
        fieldName &&
        fieldName.substring(0, 9) === "tax_id_no" &&
        fieldName.length > 9
      ) {
        dispatch(stagesAction.updateAddTaxToggle());
      }
    }
  };
 
  useEffect(() => {
    if (fieldError(fieldErrorSelector, props)) {
      setError(`${errorMsg.emity} ${props.data.rwb_label_name}`);
    } else {
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrorSelector]);
 
  useEffect(()=>{
    if(userInputSelector.applicants.crs_reason_code_a_1 !==undefined){
    if(userInputSelector.applicants.crs_reason_code_a_1 !==""
     && stageSelector[0].stageId==='ad-2' && props.data.logical_field_name === "tax_id_no"){
        show(false);
        setDefaultValue('');
        dispatch(
          stagesAction.removeAddToggleField({
            removeFields: ["tax_id_no"],
            newFields: [],
          })
        );
    }
    else if(userInputSelector.applicants["country_of_tax_residence_a_1"] === "SG" && props.data.logical_field_name === "crs_comments"){
      show(false);
    }else if(userInputSelector.applicants["country_of_tax_residence_a_1"] !== "SG" && props.data.logical_field_name === "crs_comments"){
      if(userInputSelector.applicants["crs_reason_code_a_1"]
      && userInputSelector.applicants["crs_reason_code_a_1"] !== 'B00'){
        show(false);
        dispatch(
          stagesAction.removeAddToggleField({
            removeFields: ["crs_comments"],
            newFields: [],
          })
        );
        setDefaultValue('');
      }else{
        show(true);
        dispatch(
          stagesAction.removeAddToggleField({
            removeFields: [],
            newFields: ["crs_comments"],
            value:''
          })
        );
      }
    }
    else{
      show(true)
    }
  }
  },[userInputSelector.applicants.crs_reason_code_a_1])
 
  useEffect(()=>{
    if (userInputSelector.applicants["country_of_tax_residence_a_1"] === "SG") {
      if(props.data.logical_field_name==='tax_id_no'){
      show(true);
      setError("");
      setDefaultValue(stageSelector[0].stageInfo.applicants["NRIC_a_1"]);
      dispatch(
        isFieldUpdate(
          props,
          stageSelector[0].stageInfo.applicants["NRIC_a_1"],
          props.data.logical_field_name
        )
      );
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["casa_declaration_info_3","tax_resident_of_other_country","NRIC","crs_reason_code"],
          newFields: [],
          // value: stageSelector[0].stageInfo.applicants["NRIC_a_1"]
        })
      );
      }
      else if(props.data.logical_field_name === "crs_comments"){
        show(false);
        setDefaultValue('');
      }
      else{
        show(true)
      }
    }
    else if(props.data.logical_field_name==='tax_id_no' &&
    userInputSelector.applicants["country_of_tax_residence_a_1"] &&
    userInputSelector.applicants["country_of_tax_residence_a_1"] !== 'SG'){
    //   const valObj:any={
    //     casa_fatca_declaration_a_1: '',
    //     country_of_tax_residence_a_1: '',
    //     crs_comments_a_1: '',
    //     crs_reason_code_a_1: ''
    //   }
    //   for(let key in valObj) {
    //     if(applicantsSelector[key]!==""&&applicantsSelector[key]!==undefined){
    //          valObj[key] = applicantsSelector[key];
    //     }else{
    //       delete valObj[key];
    //     }
    // }
    setDefaultValue('')
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["casa_declaration_info_3"],
          newFields: ["crs_reason_code","crs_comments"],
          // value:valObj
        })
      );
     
      if(stageSelector[0].stageInfo.applicants['tax_id_no_a_1']===''){
          setDefaultValue('');
      }
    }
    else if(props.data.logical_field_name==='tax_id_no' &&
    !userInputSelector.applicants["country_of_tax_residence_a_1"]){
    setDefaultValue('')
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["tax_id_no"],
          newFields: ["crs_reason_code","crs_comments"],
          // value:valObj
        })
      );
    }
    else if(props.data.logical_field_name==='crs_comments' &&
    userInputSelector.applicants["country_of_tax_residence_a_1"] &&
    userInputSelector.applicants["country_of_tax_residence_a_1"] !== 'SG'){
      show(false)
      if(stageSelector[0].stageInfo.applicants['crs_comments_a_1']===''){
        setDefaultValue('');
    }
    }
    else{
      show(true)
    }
  },[userInputSelector.applicants.country_of_tax_residence_a_1]);
  useEffect(()=>{
    if(userInputSelector.applicants["tax_resident_of_other_country_a_1"] ==="Y"){
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["crs_comments","crs_reason_code"],
          newFields: [],
        })
      )
    }
   },[userInputSelector.applicants.tax_resident_of_other_country_a_1])
   useEffect(()=>{
    if(stageSelector[0].stageId==="ad-2"){
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["purpose_of_account","insurance_consent_SG-PA","mode_of_operation",
          "pass_exp_dt",
          "crs_reason_code",
          "mobile_1_add",
          "mobile_2_add",
          "ofc1",
          "ofc2",
          "office_phone1",
          "office_phone2",
          "ohph1",
          "ohph2",
          "overseas_mobile1",
          "overseas_mobile2",
        ],
          newFields: [],
        })
      )
    }
   },[])
  useEffect(()=>{

    if(stageSelector[0].stageId==="ad-1"){
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["banca_ins_request_2",
          "crs_comments",
          "crs_reason_code",
          "deposit_insurance_scheme",
          "purpose_of_account",
          "tax_id_no",
          "casa_declaration_info_3",
          "casa_fatca_declaration",
          "NRIC",
          "annual_income_fff_2",
          "banca_ins_request_1",
          "credit_limit_consent",
          "myinfo_data_cli",
          "year_of_assessment_fff_2",
          "myinfo_data_nocli"
        ],
          newFields: [],
        })
      );
    }
    if(userInputSelector.applicants["crs_reason_code_a_1"] &&
    userInputSelector.applicants["crs_reason_code_a_1"] !== "B00" &&
    props.data.logical_field_name === "crs_comments"){
      show(false);
    }else{
      show(true);
    }
  },[])
  // useLayoutEffect(()=>{
  //   if(stageSelector[0].stageInfo.applicants['tax_id_no_a_1']){
  //   if(props.data.logical_field_name === "crs_comments" &&
  //   !userInputSelector.applicants["crs_comments_a_1"]){
  //     show(false)
  //   }
  //   if(props.data.logical_field_name === "tax_id_no"){
  //     show(true);
  //   }
  // }
  //   if(!userInputSelector.applicants["tax_id_no_a_1"] &&
  //   userInputSelector.applicants["crs_reason_code_a_1"] === "B00" &&
  //   props.data.logical_field_name === "crs_comments"){
  //     show(true);
  //   }
  // })
  useEffect(()=>{
    if(userInputSelector.applicants.tax_id_no_a_1!==''
    && userInputSelector.applicants.tax_id_no_a_1!==undefined
    && props.data.logical_field_name === "crs_comments"){
      show(false);
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: ["crs_reason_code","crs_comments"],
          newFields: [],
        })
      )
    }
    else if(userInputSelector.applicants.tax_id_no_a_1==='' && props.data.logical_field_name === "crs_comments"){
      show(true);
    }
  },[userInputSelector.applicants.tax_id_no_a_1]);
 
  useEffect(()=>{
    if(props.data.logical_field_name === "embossed_dc_name_rwb"){
      if(userInputSelector.applicants.issuance_type_a_1 === undefined || (!userInputSelector.applicants["debit_card_request_rwb_a_1"] || userInputSelector.applicants["debit_card_request_rwb_a_1"] === "") || userInputSelector.applicants["debit_card_request_rwb_a_1"] === "N"){
        show(false)
      }else if(userInputSelector.applicants["debit_card_request_rwb_a_1"] === "Y" && userInputSelector.applicants.issuance_type_a_1 === "I"){
        show(false)
      }else if(userInputSelector.applicants["debit_card_request_rwb_a_1"] === "Y" && userInputSelector.applicants.issuance_type_a_1 === "P"){
        show(true)
      }else{
        show(false)
      }
    }else{
      show(true)
    }
  },[userInputSelector.applicants.issuance_type_a_1, userInputSelector.applicants.debit_card_request_rwb_a_1])
 
  useEffect(()=>{
    if((userInputSelector.applicants.select_alt_contacts_a_1 === undefined || userInputSelector.applicants.select_alt_contacts_a_1 === "") && (props.data.logical_field_name === "per_email_2" || props.data.logical_field_name === "office_email_1" || props.data.logical_field_name === "office_email_2")){
      show(false)
    }else if(userInputSelector.applicants.select_alt_contacts_a_1){
      let displayFields = userInputSelector.applicants.select_alt_contacts_a_1.split(",");
      if(displayFields.includes("CO1") && props.data.logical_field_name === "per_email_2"){
        show(true)
      }else if(displayFields.includes("EMO") && props.data.logical_field_name === "office_email_1"){
        show(true)
      }else if(displayFields.includes("EM1") && props.data.logical_field_name === "office_email_2"){
        show(true)
      }else if((!displayFields.includes("CO1") || !displayFields.includes("EMO") || !displayFields.includes("EM1")) && (props.data.logical_field_name === "per_email_2" || props.data.logical_field_name === "office_email_1" || props.data.logical_field_name === "office_email_2")){
        show(false)
      }
    }
    else{
      show(true)
    }
  },[userInputSelector.applicants.select_alt_contacts_a_1])

useEffect(() => {  
  if(props.data.logical_field_name === "ofc_block"){
    if(userInputSelector.applicants.ofc_country_a_1 || stageSelector[0].stageInfo.applicants.ofc_country_a_1){
      dispatch(fieldErrorAction.getMandatoryFields(["ofc_block"]));
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: [],
          newFields: ["ofc_block"],
          value: userInputSelector.applicants.ofc_block_a_1?userInputSelector.applicants.ofc_block_a_1:stageSelector[0].stageInfo.applicants.ofc_block_a_1,
        })
      );            
    }
    if(applicantsSelector?.["ofc_country_a_1"]===''){
      if(applicantsSelector?.ofc_block_a_1 === '' || stageSelector[0].stageInfo.applicants.ofc_country_a_1 === ""){
        setDefaultValue('');
      }
    }
  }
  if(props.data.logical_field_name === "ofc_street_name"){
    const stageIndex = getUrl
        .getUpdatedStage()
        .updatedStageInputs.filter(
          (ref: any) => ref && ref.stageId === 'ad-1'
        );
    if(userInputSelector.applicants.ofc_country_a_1 || stageSelector[0].stageInfo.applicants.ofc_country_a_1){
      dispatch(fieldErrorAction.getMandatoryFields(["ofc_street_name"]));
      dispatch(
        stagesAction.removeAddToggleField({
          removeFields: [],
          newFields: ["ofc_street_name"],
          value: userInputSelector.applicants.ofc_street_name_a_1?userInputSelector.applicants.ofc_street_name_a_1:stageSelector[0].stageInfo.applicants.ofc_street_name_a_1,
        })
      );            
    }
    if(applicantsSelector?.["ofc_country_a_1"]===''){
      if(applicantsSelector?.ofc_street_name_a_1 === '' || stageSelector[0].stageInfo.applicants.ofc_country_a_1 === ""){
        setDefaultValue('');
      }
    }
  }
  if(props.data.logical_field_name === "ofc_building_name"){
    if(applicantsSelector?.["ofc_country_a_1"]===''){
      if(applicantsSelector?.ofc_building_name_a_1 === '' || stageSelector[0].stageInfo.applicants.ofc_country_a_1 === ""){
        setDefaultValue('');
      }
    }
  }
  if(props.data.logical_field_name === "ofc_unit_no"){
    if(applicantsSelector?.["ofc_country_a_1"]===''){
      if(applicantsSelector?.ofc_unit_no_a_1 === '' || stageSelector[0].stageInfo.applicants.ofc_country_a_1 === ""){
        setDefaultValue('');
      }
    }
  }
}, [userInputSelector.applicants.ofc_country_a_1]);

useEffect(() => {  
  const selectedContacts = userInputSelector.applicants.select_alt_contacts_a_1 && userInputSelector.applicants.select_alt_contacts_a_1.split(',');
  if (selectedContacts?.length > 0) {
    if (props.data.logical_field_name === "office_email_2" && !userInputSelector.applicants.office_email_2_a_1 && !selectedContacts.includes('EM1')) {
      debugger
      setDefaultValue('');
    } else if (props.data.logical_field_name === "per_email_2" && !userInputSelector.applicants.per_email_2_a_1 && !selectedContacts.includes('CO1')) {
      debugger
      setDefaultValue('');
    } else if (props.data.logical_field_name === "office_email_1" && !userInputSelector.applicants.office_email_1_a_1 && !selectedContacts.includes('EMO')) {
      debugger
      setDefaultValue('');
    }
  } else {
    if (props.data.logical_field_name === "office_email_2" || props.data.logical_field_name === "per_email_2" || props.data.logical_field_name === "office_email_1") {
      debugger
      if (userInputSelector.applicants.select_alt_contacts_a_1 !== undefined) {
        debugger
        setDefaultValue('');
      }
    }
  }
}, [userInputSelector.applicants.select_alt_contacts_a_1]);
useEffect(() => {
  if(stageSelector[0].stageId === "bd-2"){
  const textValueMapping: Record<string, string[]> = {
    PER: ["per_block", "per_building_name", "per_street_name", "per_unit_no"],
    AL1: ["alt_block_1", "alt_street_name_1", "alt_building_name_1", "alt_unit_no_1"],
    AL2: ["alt_block_2", "alt_street_name_2", "alt_building_name_2", "alt_unit_no_2"],
    AL3: ["alt_block_3", "alt_street_name_3", "alt_building_name_3", "alt_unit_no_3"],
    AL4: ["alt_block_4", "alt_street_name_4", "alt_building_name_4", "alt_unit_no_4"],
    AL5: ["alt_block_5", "alt_street_name_5", "alt_building_name_5", "alt_unit_no_5"],
  };

  // Ensure the field is reset properly
  const resetFieldIfNeeded = () => {
    if (userInputSelector.applicants.select_alt_addresses_a_1) {
      const selectedValues = userInputSelector.applicants.select_alt_addresses_a_1.split(",");
      Object.entries(textValueMapping).forEach(([key, fields]) => {
        if (!selectedValues.includes(key)) {
          fields.forEach((field) => {
            if (field === props.data.logical_field_name) {
              setDefaultValue(""); 
              dispatch(stagesAction.removeAddToggleField({
                removeFields: [field],
                newFields: [],
              }))
              
            }
          });
        }
      });
    }
    if (userInputSelector.applicants.select_alt_addresses_a_1==="") {
      Object.entries(textValueMapping).forEach(([key, fields]) => {

        fields.forEach((field) => {
          if (field === props.data.logical_field_name) {
            setDefaultValue(""); 
            dispatch(stagesAction.removeAddToggleField({
              removeFields: [field],
              newFields: [],
            }))
          }
        });
      });
    }

  };
  
  resetFieldIfNeeded();
}
}, [userInputSelector.applicants.select_alt_addresses_a_1, props.data.logical_field_name]);

  // useEffect(() => {
  //   if (
  //     props.data.logical_field_name === "referral_id_2" &&
  //     referralcodeSelector &&
  //     referralcodeSelector.errormsg !== ""
  //   ) {
  //     setError(referralcodeSelector.errormsg);
  //     if (
  //       referralcodeSelector &&
  //       referralcodeSelector.referId !== "" &&
  //       referralcodeSelector.referId !== null &&
  //       referralcodeSelector.referId.length === 1
  //     ) {
  //       dispatch(referralcodeAction.setReferralId(""));
  //       setDefaultValue("");
  //       dispatch(referralcodeAction.setReferralErrorMsg(""));
  //     }
  //   } else {
  //     setError("");
  //   }
 
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [referralcodeSelector.errormsg]);
 
  const embossedNameCounter = (value: string) => {
    setEmbossCounter(value.length);
  };
 
  const placeHolderText = (fieldName: string) => {
    if (fieldName === "passport_no") {
      return "Enter your passport Number";
    }if (fieldName === "referral_id_2" && stageSelector[0].stageId !== "bd-1") {
      return "Enter referral code here";
    } else {
      return props.data.rwb_label_name;
    }
  };
  const removeAliasField = () => {
    dispatch(aliasAction.removeAliasField(props.data.logical_field_name));
    dispatch(
      fieldErrorAction.removeMandatoryFields([props.data.logical_field_name])
    );
    dispatch(
      stagesAction.removeAddToggleField({
        removeFields: [props.data.logical_field_name],
        newFields: [],
      })
    );
  };
  const focusHandler = (
    fieldName: string,
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    dispatch(lastAction.getField(fieldName));
  };
 
  const allowNumericCharacter = (
    event: React.KeyboardEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    if(fieldName === 'referral_id_2'){
      validateService.allowOnlyCharacter(event, fieldName);
    }
  };

  useEffect(()=>{
    if(stageSelector[0].stageId==="bd-3"){
      if(props.data.logical_field_name === "existing_personal_email_co1" && userInputSelector.applicants.existing_personal_email_co1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_personal_email_co1" && userInputSelector.applicants.existing_personal_email_co1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_office_email_em1" && userInputSelector.applicants.existing_office_email_em1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_office_email_em1" && userInputSelector.applicants.existing_office_email_em1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_office_email_em2" && userInputSelector.applicants.existing_office_email_em2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_office_email_em2" && userInputSelector.applicants.existing_office_email_em2_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_mobile_mo1" && userInputSelector.applicants.existing_mobile_mo1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_mobile_mo1" && userInputSelector.applicants.existing_mobile_mo1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_mobile_mo2" && userInputSelector.applicants.existing_mobile_mo2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_mobile_mo2" && userInputSelector.applicants.existing_mobile_mo2_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_overseas_mobile_mf1" && userInputSelector.applicants.existing_overseas_mobile_mf1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_overseas_mobile_mf1" && userInputSelector.applicants.existing_overseas_mobile_mf1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_overseas_mobile_mf2" && userInputSelector.applicants.existing_overseas_mobile_mf2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_overseas_mobile_mf2" && userInputSelector.applicants.existing_overseas_mobile_mf2_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_office_telephone_ot1" && userInputSelector.applicants.existing_office_telephone_ot1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_office_telephone_ot1" && userInputSelector.applicants.existing_office_telephone_ot1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_office_telephone_ot2" && userInputSelector.applicants.existing_office_telephone_ot2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_office_telephone_ot2" && userInputSelector.applicants.existing_office_telephone_ot2_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_residential_telephone_rt2" && userInputSelector.applicants.existing_residential_telephone_rt2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_residential_telephone_rt2" && userInputSelector.applicants.existing_residential_telephone_rt2_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_overseas_office_telno_of1" && userInputSelector.applicants.existing_overseas_office_telno_of1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_overseas_office_telno_of1" && userInputSelector.applicants.existing_overseas_office_telno_of1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_overseas_office_telno_of2" && userInputSelector.applicants.existing_overseas_office_telno_of2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_overseas_office_telno_of2" && userInputSelector.applicants.existing_overseas_office_telno_of2_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_overseas_residential_telno_rf1" && userInputSelector.applicants.existing_overseas_residential_telno_rf1_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_overseas_residential_telno_rf1" && userInputSelector.applicants.existing_overseas_residential_telno_rf1_a_1 === ""){
        show(false)
      }else if(props.data.logical_field_name === "existing_overseas_residential_telno_rf2" && userInputSelector.applicants.existing_overseas_residential_telno_rf2_a_1 !== ""){
        show(true)
      }else if(props.data.logical_field_name === "existing_overseas_residential_telno_rf2" && userInputSelector.applicants.existing_overseas_residential_telno_rf2_a_1 === ""){
        show(false)
      }
    }
   },[userInputSelector.applicants])

    return (
    <>
      {(props.data.logical_field_name === "embossed_dc_name" ||
        props.data.logical_field_name === "embossed_name" ||
        props.data.logical_field_name === "embossed_name_2") && (
        <Cards name={defaultValue} />
      )}
     {/* {(showReferralCode || */}
 
       { hide&&(props.data.logical_field_name !== "referral_id_2") && (
      <div className={`${(((userInputSelector.applicants["application_sourcing_a_1"] === null ||
      userInputSelector.applicants["application_sourcing_a_1"] === '1') && (props.data.logical_field_name === "staff_id" || props.data.logical_field_name === "staff_name")) || 
      (stageSelector[0].stageId === "bd-2" && (props.data.logical_field_name === "alt_address_rwb_1" || props.data.logical_field_name === "alt_address_rwb_2" || props.data.logical_field_name === "alt_address_rwb_3" || props.data.logical_field_name === "alt_address_rwb_4" || props.data.logical_field_name === "alt_address_rwb_5"))) ? 'novisiblity':'text'}`}
      id={(stageSelector[0].stageId ==="bd-1" || stageSelector[0].stageId === "ad-1") && props.data.logical_field_name}>
        <label htmlFor={props.data.logical_field_name}>
          {props.data.rwb_label_name}
        </label>
        {/* {showReferralCode && stageSelector[0].stageId !== "bd-1" && (<ReferralCode />)} */}
        <div
          className={`text__count ${
            // (userInputSelector.applicants["casa_fatca_declaration_a_1"] ===
            //   "Y" &&
            //   props.data.logical_field_name === "tax_id_no") ||
            (stageSelector[0].stageId === "bd-1" &&
              props.data.logical_field_name.substring(0, 5) === "alias")
              ? "disabled"
              : ""
          } ${
            stageSelector[0].stageId === "ssf-1" && authenticateType() === "myinfo" && props.data.logical_field_name === "NRIC"
              ? "disabled"
              : ""
          }${
            stageSelector[0].stageId === "ssf-1" && authenticateType() === "myinfo" && props.data.logical_field_name === "full_name"
              ? "disabled"
              : ""
          }${
              stageSelector[0].stageId === "ad-2" && authenticateType() === "myinfo" && props.data.logical_field_name === "tax_id_no"
              && userInputSelector.applicants["country_of_tax_residence_a_1"] === "SG"
                ? "disabled"
                : ""
            }
          ${
              stageSelector[0].stageId === "bd-2" && authenticateType() === "myinfo" && ((props.data.logical_field_name === "block_rwb" || props.data.logical_field_name === "building_name_rwb" || props.data.logical_field_name==="street_name_rwb" ||props.data.logical_field_name==="unit_no_rwb" ||props.data.logical_field_name==="permanent_address_rwb_1"||props.data.logical_field_name==="residential_address_rwb_1"))
                ? "disabled"
                : ""
            }
            ${
              stageSelector[0].stageId === "bd-2" && (((props.data.logical_field_name === "permanent_address_rwb_1" && stageSelector[0].stageInfo.applicants.permanent_address_rwb_1_a_1) 
              || (props.data.logical_field_name === "residential_address_rwb_1" && stageSelector[0].stageInfo.applicants.residential_address_rwb_1_a_1)))
                ? "disabled"
                : ""
            }
            ${
              stageSelector[0].stageId === "bd-3" && authenticateType() === "myinfo" && ((props.data.logical_field_name === "existing_personal_email_co1" || props.data.logical_field_name === "existing_office_email_em1" || 
              props.data.logical_field_name==="existing_office_email_em2" || props.data.logical_field_name==="existing_mobile_mo1" || props.data.logical_field_name==="existing_mobile_mo2" || props.data.logical_field_name==="existing_overseas_mobile_mf1" ||
              props.data.logical_field_name==="existing_overseas_mobile_mf2" || props.data.logical_field_name==="existing_office_telephone_ot1" || props.data.logical_field_name === "existing_office_telephone_ot2" || props.data.logical_field_name === "existing_residential_telephone_rt2" ||
              props.data.logical_field_name === "existing_overseas_office_telno_of1" || props.data.logical_field_name === "existing_overseas_office_telno_of2" || props.data.logical_field_name === "existing_overseas_residential_telno_rf1" ||
              props.data.logical_field_name === "existing_overseas_residential_telno_rf2"))
                ? "disabled"
                : ""
            }`
          }
        >
          <input
            type={props.data.type}
            name={props.data.logical_field_name}
            aria-label={props.data.logical_field_name}
            id={fieldIdAppend(props)}
            placeholder={placeHolderText(props.data.logical_field_name)}
            value={(stageSelector[0].stageId === "ad-1" && props.data.logical_field_name === "td_client_rate" && userInputSelector.applicants["td_client_rate_a_1"]) ? userInputSelector.applicants["td_client_rate_a_1"]:defaultValue}
            minLength={props.data.logical_field_name !== "referral_id_2" && props.data.min_length}
            maxLength={props.data.length}
            pattern={regexPattern}
            onChange={changeHandler.bind(this, props.data.logical_field_name)}
            onBlur={bindHandler.bind(this, props.data.logical_field_name)}
            disabled={
              ((props.data.editable || stageSelector[0].stageId === "bd-1")
               &&
               props.data.logical_field_name !== "referral_id_2") ||
             (stageSelector[0].stageId === "bd-1" &&
               props.data.logical_field_name === "referral_id_2") ||
             (stageSelector[0].stageId === "ad-1" &&
               props.data.logical_field_name === "td_client_rate") ||
               (stageSelector[0].stageId === "bd-3" &&userInputSelector.applicants["ofc_country_a_1"] ===""&&(props.data.logical_field_name!=="name_of_business" 
               && props.data.logical_field_name!=="per_email_2" && props.data.logical_field_name!=="office_email_1" 
               && props.data.logical_field_name!=="office_email_2" && props.data.logical_field_name!=="staff_id" && props.data.logical_field_name!=="staff_name" && props.data.logical_field_name!=="name_of_employer_other"))
             }
            onFocus={focusHandler.bind(this, props.data.logical_field_name)}
            onKeyPress={(event) =>
              allowNumericCharacter(event, props.data.logical_field_name)
            }
          />
          {error && <span className="error-msg">{error}</span>}
          {props.data.logical_field_name &&
            props.data.logical_field_name.split("_")[0] === "alias" &&
            props.data.logical_field_name.split("_")[1] !== "1" &&
            !props.data.hide_remove_btn && (
              <span
                className="text__remove__button"
                onClick={() => removeAliasField()}
              ></span>
            )}
          {(props.data.logical_field_name === "embossed_dc_name" ||
            props.data.logical_field_name === "embossed_name" ||
            props.data.logical_field_name === "embossed_name_2") && (
            <span className="text__count__num">{embossCounter}/19</span>
          )}
        </div>
      </div>
      )}
    </>
  );
};
 
export default Text;
 
 
