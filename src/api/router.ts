import express, { type Router } from "express";
import { uploadSingleCSV } from "@/common/middleware/fileUpload";
import { validateDto } from "@/common/middleware/validateDto";
import { ReportQueryDTO } from "@/api/report/dto/reportQuery.dto";
import { CustomerIdParamDTO } from "@/api/report/dto/customerId-param.dto";
import { uploadCustomers } from "./customer/customerController";
import { uploadOrders } from "./order/orderController";
import { getCustomerSummary, getCustomerOrdersReport } from "./report/reportController";

const apiRouter: Router = express.Router();

apiRouter.post("/upload/customers", uploadSingleCSV, uploadCustomers);
apiRouter.post("/upload/orders", uploadSingleCSV, uploadOrders);
apiRouter.get("/customers/:customerId/summary", validateDto(CustomerIdParamDTO, "params"), getCustomerSummary);
apiRouter.get("/reports/customer-orders", validateDto(ReportQueryDTO, "query"), getCustomerOrdersReport);

export { apiRouter };
