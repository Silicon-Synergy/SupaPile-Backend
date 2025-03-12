import chalk from "chalk";
import mongoose from "mongoose";
import ora from "ora";

//connect to moongoose
export const dbConnect = async () => {
  const spinner = ora("connecting to database").start();
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    spinner.succeed(chalk.greenBright("database connected"));
  } catch (error) {
    spinner.fail(chalk.redBright("failed to connect to database"));
    console.log(chalk.redBright(error));
    process.exit(1);
  }
};
