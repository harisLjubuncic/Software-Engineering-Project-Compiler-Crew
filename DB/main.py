from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, Enum, DECIMAL, Date, TIMESTAMP
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
import enum

DATABASE_URI = 'mysql+pymysql://AQ:Century21!@localhost/job_portal'

engine = create_engine(DATABASE_URI, echo=True)

Base = declarative_base()

class UserType(enum.Enum):
    job_seeker = "job_seeker"
    employer = "employer"

class JobType(enum.Enum):
    full_time = "full-time"
    part_time = "part-time"
    contract = "contract"

class ApplicationStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"

class User(Base):
    __tablename__ = 'Users'
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    user_type = Column(Enum(UserType), nullable=False)
    date_created = Column(TIMESTAMP, default=func.now())

class JobListing(Base):
    __tablename__ = 'JobListings'
    job_id = Column(Integer, primary_key=True, autoincrement=True)
    employer_id = Column(Integer, ForeignKey('Users.user_id'))
    job_title = Column(String(100), nullable=False)
    job_description = Column(Text, nullable=False)
    location = Column(String(100))
    salary = Column(DECIMAL(10, 2))
    date_posted = Column(TIMESTAMP, default=func.now())
    application_deadline = Column(Date)
    job_type = Column(Enum(JobType))

class Application(Base):
    __tablename__ = 'Applications'
    application_id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey('JobListings.job_id'))
    job_seeker_id = Column(Integer, ForeignKey('Users.user_id'))
    application_date = Column(TIMESTAMP, default=func.now())
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending)

class Resume(Base):
    __tablename__ = 'Resumes'
    resume_id = Column(Integer, primary_key=True, autoincrement=True)
    job_seeker_id = Column(Integer, ForeignKey('Users.user_id'))
    resume_file_path = Column(String(255), nullable=False)
    date_uploaded = Column(TIMESTAMP, default=func.now())

class Company(Base):
    __tablename__ = 'Companies'
    company_id = Column(Integer, primary_key=True, autoincrement=True)
    employer_id = Column(Integer, ForeignKey('Users.user_id'))
    company_name = Column(String(100), nullable=False)
    industry = Column(String(50))
    company_description = Column(Text)
    location = Column(String(100))

class SavedJob(Base):
    __tablename__ = 'SavedJobs'
    saved_job_id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey('JobListings.job_id'))
    job_seeker_id = Column(Integer, ForeignKey('Users.user_id'))
    date_saved = Column(TIMESTAMP, default=func.now())

class JobCategory(Base):
    __tablename__ = 'JobCategories'
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(50), nullable=False)

class JobListingCategory(Base):
    __tablename__ = 'JobListingCategories'
    job_listing_category_id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey('JobListings.job_id'))
    category_id = Column(Integer, ForeignKey('JobCategories.category_id'))

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
session = Session()
