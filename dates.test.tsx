import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import Date from "./dates";
import validateService from "../../../services/validation-service";
import errorMsg from "../../../assets/_json/error.json";
import thunk from "redux-thunk";


jest.mock("../../../services/validation-service", () => ({
  isValidDate: jest.fn(),
  calculateAge: jest.fn(),
  validateAge: jest.fn(),
  getValidationMsg: jest.fn(),
  allowOnlyCharacter: jest.fn(),
  passExpDate: jest.fn()
}));

jest.mock("../../../utils/common/change.utils", () => ({
    ...jest.requireActual("../../../utils/common/change.utils"),
    handleFieldDispatch: jest.fn().mockReturnValue("mocked-flow-type"), // Mocked return value
}));


jest.mock("../../../utils/store/last-accessed-slice", () => ({
  lastAction: {
    getField: jest.fn(),
  },
}));

const mockStore = configureStore([thunk]);

describe("Date Component", () => {
  let store: any;
  let mockProps: any;

  beforeEach(() => {
    jest.spyOn(console,"error").mockImplementation(()=>{});
    jest.clearAllMocks();

    store = mockStore({
      fielderror: { error: {} },
      stages: {
        stages: [{ stageInfo: { applicants: {
          sample_field_a_1: 15-10-1995,
        }, products: [{
            product_type:'337',
            product_category:'CA'
        }] }, stageId: "test" }],
        userInput: { applicants: [{credit_into_a_1:'Other Bank Account',other_bank_name_a_1 :''}] },
        myinfoResponse: {},
        dependencyFields: null,
        journeyType: "ETC",
      },
      loanTopUp: { selectedLoan: null, selectedAccount: null },
    });

    store.dispatch = jest.fn();
    mockProps = {
      data: {
        logical_field_name: "date_of_birth",
        rwb_label_name: "Date of Birth",
        mandatory: "Yes",
        editable: false,
      },
      handleCallback: jest.fn(),
      handleFieldDispatch:jest.fn()
    };
  });
  const renderComponent = () =>
    render(
      <Provider store={store}>
        <Date {...mockProps} />
      </Provider>
    );

  it("should render the component with initial values", () => {
    renderComponent();
    expect(screen.getByPlaceholderText("DD")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("MM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("YYYY")).toBeInTheDocument();
  });

  it("should call handleCallback when a field changes", () => {
    renderComponent();
    const dayInput = screen.getByPlaceholderText("DD");
    fireEvent.change(dayInput, { target: { value: "16" } });

    expect(mockProps.handleCallback).toHaveBeenCalled();
  });

  it("should call handleCallback when a field changes", () => {
    renderComponent();
    const monthInput = screen.getByPlaceholderText("MM");
    fireEvent.change(monthInput, { target: { value: "01" } });

    expect(mockProps.handleCallback).toHaveBeenCalled();
  });
  it("should validate the date when all fields are filled and should show an error if the date is invalid", () => {
    (validateService.isValidDate as jest.Mock).mockReturnValue(true);
    (validateService.validateAge as jest.Mock).mockReturnValue(true);
    (validateService.getValidationMsg as jest.Mock).mockReturnValue("should not be less than 18 years and greater than 90 years");

    renderComponent();
    const dayInput = screen.getByPlaceholderText("DD");
    fireEvent.change(dayInput, { target: { value: "16" } });
    const monthInput = screen.getByPlaceholderText("MM");
    fireEvent.change(monthInput, { target: { value: "01" } });
    const yearInput = screen.getByPlaceholderText("YYYY");
    fireEvent.change(yearInput, { target: { value: "2020" } });

    expect(validateService.isValidDate).toHaveBeenCalled();
    expect(validateService.validateAge).toHaveBeenCalled();
    expect(screen.getByText(`${mockProps.data.rwb_label_name} should not be less than 18 years and greater than 90 years`)).toBeInTheDocument();

  });

  it("should handle mandatory fields correctly", () => {
    (validateService.isValidDate as jest.Mock).mockReturnValue(true);
    (validateService.validateAge as jest.Mock).mockReturnValue(false);

    renderComponent();
    const dayInput = screen.getByPlaceholderText("DD");
    fireEvent.change(dayInput, { target: { value: "16" } });
    const monthInput = screen.getByPlaceholderText("MM");
    fireEvent.change(monthInput, { target: { value: "01" } });
    const yearInput = screen.getByPlaceholderText("YYYY");
    fireEvent.change(yearInput, { target: { value: "2000" } });

    expect(validateService.isValidDate).toHaveBeenCalled();
    expect(validateService.validateAge).toHaveBeenCalled();
  });

  it("should validate the passport expiry date field and should show an error if the date is invalid", () => {
    (validateService.passExpDate as jest.Mock).mockReturnValue(false);

    const mockProps1 = {
      data: {
        logical_field_name: "pass_exp_dt",
        rwb_label_name: "Passport Expiry Date",
        mandatory: "Yes",
        editable: false,
      },
      handleCallback: jest.fn(),
      handleFieldDispatch: jest.fn()
    };
    render(
      <Provider store={store}>
        <Date {...mockProps1} />
      </Provider>
    );

    const dayInput = screen.getByPlaceholderText("DD");
    fireEvent.change(dayInput, { target: { value: "16" } });
    const monthInput = screen.getByPlaceholderText("MM");
    fireEvent.change(monthInput, { target: { value: "01" } });
    const yearInput = screen.getByPlaceholderText("YYYY");
    fireEvent.change(yearInput, { target: { value: "2024" } });

    expect(validateService.passExpDate).toHaveBeenCalled();
    expect(screen.getByText(`${errorMsg.passportExpiryError}`)).toBeInTheDocument();
  });
  // it("should show an error if the date is invalid", () => {
  //   (validateService.isValidDate as jest.Mock).mockReturnValue(false);

  //   renderComponent();

  //   const yearInput = screen.getByPlaceholderText("YYYY");
  //   fireEvent.change(yearInput, { target: { value: "abcd" } });

  //   expect(screen.getByText(`${errorMsg.patterns} Date of Birth`)).toBeInTheDocument();
  // });

  // it("should handle mandatory fields correctly", () => {
  //   renderComponent();

  //   const dayInput = screen.getByPlaceholderText("DD");
  //   fireEvent.change(dayInput, { target: { value: "" } });

  //   expect(screen.getByText(`Date of Birth`)).toBeInTheDocument();
  // });

 

  // it("should auto-bind a single digit to a two-digit format for DD/MM", () => {
  //   renderComponent();

  //   const dayInput = screen.getByPlaceholderText("DD");
  //   fireEvent.blur(dayInput, { target: { value: "7" } });

  //   expect(dayInput).toHaveValue("7");
  // });

  // it("should not disable inputs if the field is  editable", () => {
  //   renderComponent();

  //   const dayInput = screen.getByPlaceholderText("DD");
  //   expect(dayInput).not.toBeDisabled();
  // });

  // it("should set error based on fieldErrorSelector", () => {
  //   store = mockStore({
  //     stages: {
  //       stages: [
  //         {
  //           stageInfo: {
  //             applicants: {},
  //             products: [],
  //           },
  //         },
  //       ],
  //     },
  //     fielderror: {
  //       error: [{ fieldName: "sample_field" }],
  //     },
  //   });

  //   renderComponent();
  //   expect(screen.getByText(`Date of Birth`)).toBeInTheDocument();
  // });
});
