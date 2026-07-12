import {
  Controller,
  Post,
  Body,
  Inject,
  Put,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateUserDto } from 'src/infraestructure/dtos/users/create-user.dto';
import { LoginUserDto } from 'src/infraestructure/dtos/users/login-user.dto';
import { PasswordRecoveryDto } from 'src/infraestructure/dtos/users/password-recovery.dto';
import { ChangePasswordDto } from 'src/infraestructure/dtos/users/change-password.dto';
import {
  IUsersServiceToken,
  type IUsersService,
} from 'src/domain/interfaces/users-service.interface';
import {
  IPasswordRecoveryServiceToken,
  type IPasswordRecoveryService,
} from 'src/domain/interfaces/password-recovery-service.interface';
import { UpdateUserDto } from 'src/infraestructure/dtos/users/update-user.dto';
import { AuthenticatedUser } from '../decorators/authenticated-user.decorator';
import type { JwtPayload } from 'src/infraestructure/dtos/shared/jwt-payload.interface';
import { UpdateUserPasswordDto } from 'src/infraestructure/dtos/users/update-user-password.dto';
import { ReviewDto } from 'src/infraestructure/dtos/users/review.dto';
import {
  IUserReviewServiceToken,
  type IUserReviewService,
} from 'src/domain/interfaces/user-review.interface';
import type { IDiscountCouponService } from 'src/domain/interfaces/discount-coupon-service.interface';
import { IDiscountCouponServiceToken } from 'src/domain/interfaces/discount-coupon-service.interface';
import { SpendeeAuthBodyDto } from 'src/infraestructure/dtos/users/spendee-auth-body.dto';
import { AuthenticatedWorkshop } from '../decorators/authenticated-mechanic.decorator';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(IUsersServiceToken) private readonly usersService: IUsersService,
    @Inject(IPasswordRecoveryServiceToken)
    private readonly passwordRecoveryService: IPasswordRecoveryService,
    @Inject(IUserReviewServiceToken)
    private readonly userReviewService: IUserReviewService,
    @Inject(IDiscountCouponServiceToken)
    private readonly discountCouponService: IDiscountCouponService,
  ) {}

  @Get('/workshops')
  async getAllWorkshops() {
    const workshops = await this.usersService.getAllWorkshops();
    const mechanicIds = workshops.map((workshop) => workshop.id);
    const reviewMap =
      (await this.userReviewService.getMechanicsReviews(mechanicIds)) || {};
    const workshopsWithReviews = workshops.map((w) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hashedPassword, ...workshop } = w;
      return {
        ...workshop,
        reviews: reviewMap[workshop.id]?.reviews ?? [],
        subCategories: reviewMap[workshop.id]?.subCategories ?? [],
      };
    });
    return workshopsWithReviews;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put()
  update(@Body() dto: UpdateUserDto, @AuthenticatedUser() user: JwtPayload) {
    return this.usersService.update(user, dto);
  }

  @Put('/password')
  updatePassword(
    @Body() dto: UpdateUserPasswordDto,
    @AuthenticatedUser() user: JwtPayload,
  ) {
    return this.usersService.updatePassword(user, dto);
  }

  @Post('/login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }

  @Post('/password-recovery')
  passwordRecovery(@Body() passwordRecoveryDto: PasswordRecoveryDto) {
    return this.passwordRecoveryService.request(passwordRecoveryDto);
  }

  @Post('/change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return this.passwordRecoveryService.change(changePasswordDto);
  }

  @Post('/review')
  review(@Body() reviewDto: ReviewDto, @AuthenticatedUser() user: JwtPayload) {
    return this.userReviewService.setReview(
      user.id,
      reviewDto.mechanicId,
      reviewDto.appointmentId,
      reviewDto.review,
      reviewDto.subCategories,
    );
  }

  @Get('/review')
  async getReviews(@AuthenticatedUser() user: JwtPayload) {
    const reviews = await this.userReviewService.getUserReviews(user.id);
    return { reviews };
  }

  @Get('/review/:mechanicId')
  async getReview(@Param('mechanicId', new ParseIntPipe()) mechanicId: number) {
    const map = await this.userReviewService.getMechanicsReviews([mechanicId]);
    const entry = map[mechanicId] ?? { reviews: [], subCategories: [] };
    return entry;
  }

  @Get('/ranking')
  async getTopWorkshops() {
    return this.userReviewService.getTopMechanics(10);
  }

  @Get('/ranking/mechanic/:mechanicId')
  async getMechanicRankingForClient(
    @Param('mechanicId', ParseIntPipe) mechanicId: number,
  ) {
    return this.userReviewService.getMechanicRanking(mechanicId);
  }

  @Get('/:id')
  getUser(
    @AuthenticatedUser() _user: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
  ) {
    return this.usersService.findById(id);
  }

  @Get('/rewards/progress/:workshopId')
  async getRewardsProgress(
    @AuthenticatedUser() user: JwtPayload,
    @Param('workshopId', new ParseIntPipe()) workshopId: number,
  ) {
    return this.discountCouponService.getUserCouponProgress(
      user.id,
      workshopId,
    );
  }

  @Get('/ranking/me')
  async getMyRanking(@AuthenticatedWorkshop() mechanic: JwtPayload) {
    return this.userReviewService.getMechanicRankingWithAdvice(mechanic.id);
  }

  @Get('/ranking/goals')
  async getRankingGoals(@AuthenticatedWorkshop() mechanic: JwtPayload) {
    return this.userReviewService.getRankingGoals(mechanic.id);
  }

  @Get('/coupons/available/:workshopId')
  async getAvailableCoupons(
    @AuthenticatedUser() user: JwtPayload,
    @Param('workshopId', ParseIntPipe) workshopId: number,
  ) {
    return this.discountCouponService.getAvailableCoupons(user.id, workshopId);
  }

  @Post('/spendee-auth')
  spendeeAuth(
    @AuthenticatedWorkshop() mechanic: JwtPayload,
    @Body() spendeeAuthDto: SpendeeAuthBodyDto,
  ) {
    return this.usersService.spendeeAuth(mechanic, spendeeAuthDto.code);
  }
}
