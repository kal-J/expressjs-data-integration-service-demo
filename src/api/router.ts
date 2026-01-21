import express, { type Router } from "express";
import { uploadSingleCSV } from "@/common/middleware/fileUpload";
import { validateDto } from "@/common/middleware/validateDto";
import { ReportQueryDTO } from "@/api/report/dto/reportQuery.dto";
import { CustomerIdParamDTO } from "@/api/report/dto/customerId-param.dto";
import { uploadCustomers } from "./customer/customerController";
import { uploadOrders } from "./order/orderController";
import { getCustomerSummary, getCustomerOrdersReport } from "./report/reportController";

const apiRouter: Router = express.Router();

/**
 * @route POST /api/upload/customers
 * @desc Upload customers CSV file
 */
apiRouter.post("/upload/customers", uploadSingleCSV, uploadCustomers);

/**
 * @route POST /api/upload/orders
 * @desc Upload orders CSV file
 */
apiRouter.post("/upload/orders", uploadSingleCSV, uploadOrders);

/**
 * @route GET /api/customers/:customerId/summary
 * @desc Get customer summary with orders
 */
apiRouter.get("/customers/:customerId/summary", validateDto(CustomerIdParamDTO, "params"), getCustomerSummary);

/**
 * @route GET /api/reports/customer-orders
 * @desc Get customer orders report
 */
apiRouter.get("/reports/customer-orders", validateDto(ReportQueryDTO, "query"), getCustomerOrdersReport);

export { apiRouter };
